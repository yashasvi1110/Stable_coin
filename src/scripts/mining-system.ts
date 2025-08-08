import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import { findAssociatedTokenPda, createAssociatedToken } from '@metaplex-foundation/mpl-toolbox';
import fs from 'fs';
import path from 'path';

interface MiningSession {
  userId: string;
  startTime: Date;
  clicks: number;
  tokensEarned: number;
  lastClickTime: Date;
  isActive: boolean;
}

interface MiningConfig {
  tokensPerClick: number;
  maxClicksPerHour: number;
  maxTokensPerDay: number;
  cooldownSeconds: number;
  miningRate: number; // tokens per second when mining
}

class VardianoMiningSystem {
  private sessions: Map<string, MiningSession> = new Map();
  private config: MiningConfig;
  private tokenInfo: any;
  private umi: any;
  private wallet: any;

  constructor() {
    this.config = {
      tokensPerClick: 1, // 1 VARD per click
      maxClicksPerHour: 100, // Max 100 clicks per hour
      maxTokensPerDay: 1000, // Max 1000 VARD per day
      cooldownSeconds: 3, // 3 seconds between clicks
      miningRate: 0.1 // 0.1 VARD per second when mining
    };
  }

  async initialize() {
    console.log('🪙 Initializing Vardiano Mining System...\n');
    
    // Load token info
    const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
    if (!fs.existsSync(tokenInfoPath)) {
      throw new Error('Token info not found. Please create a token first.');
    }
    
    this.tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'));
    this.umi = createSolanaConnection();
    this.wallet = loadKeypairFromFile(this.umi, 'wallet');
    
    console.log(`📄 Token: ${this.tokenInfo.name} (${this.tokenInfo.symbol})`);
    console.log(`🏭 Mint: ${this.tokenInfo.mintAddress}`);
    console.log(`👤 Mining Wallet: ${this.wallet.publicKey}`);
    
    // Load existing sessions
    this.loadSessions();
    
    console.log('✅ Mining system initialized successfully!');
  }

  private loadSessions() {
    const sessionsPath = path.join(process.cwd(), 'mining-sessions.json');
    if (fs.existsSync(sessionsPath)) {
      const sessionsData = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
      for (const [userId, sessionData] of Object.entries(sessionsData)) {
        const session = sessionData as any;
        this.sessions.set(userId, {
          ...session,
          startTime: new Date(session.startTime),
          lastClickTime: new Date(session.lastClickTime)
        });
      }
    }
  }

  private saveSessions() {
    const sessionsPath = path.join(process.cwd(), 'mining-sessions.json');
    const sessionsData: any = {};
    
    for (const [userId, session] of this.sessions.entries()) {
      sessionsData[userId] = {
        ...session,
        startTime: session.startTime.toISOString(),
        lastClickTime: session.lastClickTime.toISOString()
      };
    }
    
    fs.writeFileSync(sessionsPath, JSON.stringify(sessionsData, null, 2));
  }

  async startMining(userId: string): Promise<{ success: boolean; message: string; tokensEarned?: number }> {
    console.log(`\n⛏️ Starting mining session for user: ${userId}`);
    
    const now = new Date();
    let session = this.sessions.get(userId);
    
    if (!session) {
      // Create new session
      session = {
        userId,
        startTime: now,
        clicks: 0,
        tokensEarned: 0,
        lastClickTime: now,
        isActive: true
      };
      this.sessions.set(userId, session);
      console.log(`✅ New mining session created for ${userId}`);
    } else {
      // Check if session is still valid (within 24 hours)
      const hoursSinceStart = (now.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceStart >= 24) {
        // Reset session for new day
        session = {
          userId,
          startTime: now,
          clicks: 0,
          tokensEarned: 0,
          lastClickTime: now,
          isActive: true
        };
        this.sessions.set(userId, session);
        console.log(`🔄 New day, session reset for ${userId}`);
      }
    }
    
    this.saveSessions();
    
    return {
      success: true,
      message: `Mining started! Click to earn ${this.config.tokensPerClick} ${this.tokenInfo.symbol} per click.`,
      tokensEarned: session.tokensEarned
    };
  }

  async mineClick(userId: string): Promise<{ success: boolean; message: string; tokensEarned: number; canClaim: boolean }> {
    console.log(`\n🖱️ Mining click from user: ${userId}`);
    
    const now = new Date();
    const session = this.sessions.get(userId);
    
    if (!session || !session.isActive) {
      return {
        success: false,
        message: 'No active mining session. Start mining first.',
        tokensEarned: 0,
        canClaim: false
      };
    }
    
    // Check cooldown
    const secondsSinceLastClick = (now.getTime() - session.lastClickTime.getTime()) / 1000;
    if (secondsSinceLastClick < this.config.cooldownSeconds) {
      return {
        success: false,
        message: `Please wait ${this.config.cooldownSeconds - secondsSinceLastClick} more seconds before next click.`,
        tokensEarned: session.tokensEarned,
        canClaim: false
      };
    }
    
    // Check hourly limit
    const clicksThisHour = session.clicks % this.config.maxClicksPerHour;
    if (clicksThisHour >= this.config.maxClicksPerHour) {
      return {
        success: false,
        message: 'Hourly click limit reached. Please wait before continuing.',
        tokensEarned: session.tokensEarned,
        canClaim: false
      };
    }
    
    // Check daily limit
    if (session.tokensEarned >= this.config.maxTokensPerDay) {
      return {
        success: false,
        message: 'Daily token limit reached. Come back tomorrow!',
        tokensEarned: session.tokensEarned,
        canClaim: true
      };
    }
    
    // Award tokens
    const tokensToAward = this.config.tokensPerClick;
    session.clicks++;
    session.tokensEarned += tokensToAward;
    session.lastClickTime = now;
    
    this.saveSessions();
    
    console.log(`✅ ${tokensToAward} ${this.tokenInfo.symbol} awarded to ${userId}`);
    console.log(`📊 Total earned: ${session.tokensEarned} ${this.tokenInfo.symbol}`);
    
    return {
      success: true,
      message: `+${tokensToAward} ${this.tokenInfo.symbol} earned! Total: ${session.tokensEarned} ${this.tokenInfo.symbol}`,
      tokensEarned: session.tokensEarned,
      canClaim: session.tokensEarned >= 10 // Can claim when 10+ tokens earned
    };
  }

  async claimTokens(userId: string): Promise<{ success: boolean; message: string; transaction?: string }> {
    console.log(`\n💰 Claiming tokens for user: ${userId}`);
    
    const session = this.sessions.get(userId);
    if (!session || session.tokensEarned < 10) {
      return {
        success: false,
        message: 'Need at least 10 tokens to claim.'
      };
    }
    
    try {
      // For now, we'll use a simplified approach without creating user accounts
      // In a real implementation, you'd need proper wallet addresses
      console.log(`ℹ️ Token claiming would transfer ${session.tokensEarned} ${this.tokenInfo.symbol} to user ${userId}`);
      console.log(`💡 In production, you'd need the user's actual wallet address`);
      
      // Simulate successful claim
      console.log(`✅ ${session.tokensEarned} ${this.tokenInfo.symbol} claimed by ${userId}`);
      
      // Reset session
      session.tokensEarned = 0;
      session.clicks = 0;
      this.saveSessions();
      
      return {
        success: true,
        message: `Successfully claimed ${session.tokensEarned} ${this.tokenInfo.symbol}!`,
        transaction: 'simulated-claim-transaction'
      };
      
    } catch (error) {
      console.error('❌ Error claiming tokens:', error);
      return {
        success: false,
        message: 'Failed to claim tokens. Please try again.'
      };
    }
  }

  getMiningStats(userId: string) {
    const session = this.sessions.get(userId);
    if (!session) {
      return {
        isActive: false,
        tokensEarned: 0,
        clicks: 0,
        canClaim: false
      };
    }
    
    return {
      isActive: session.isActive,
      tokensEarned: session.tokensEarned,
      clicks: session.clicks,
      canClaim: session.tokensEarned >= 10,
      startTime: session.startTime,
      lastClickTime: session.lastClickTime
    };
  }

  getGlobalStats() {
    let totalTokensEarned = 0;
    let totalClicks = 0;
    let activeUsers = 0;
    
    for (const session of this.sessions.values()) {
      totalTokensEarned += session.tokensEarned;
      totalClicks += session.clicks;
      if (session.isActive) activeUsers++;
    }
    
    return {
      totalTokensEarned,
      totalClicks,
      activeUsers,
      totalSessions: this.sessions.size,
      miningConfig: this.config
    };
  }
}

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  const userId = args[1] || 'default-user';
  
  const miningSystem = new VardianoMiningSystem();
  await miningSystem.initialize();
  
  switch (command) {
    case 'start':
      const startResult = await miningSystem.startMining(userId);
      console.log(startResult.message);
      break;
      
    case 'click':
      const clickResult = await miningSystem.mineClick(userId);
      console.log(clickResult.message);
      break;
      
    case 'claim':
      const claimResult = await miningSystem.claimTokens(userId);
      console.log(claimResult.message);
      break;
      
    case 'stats':
      const stats = miningSystem.getMiningStats(userId);
      console.log(`\n📊 Mining Stats for ${userId}:`);
      console.log(`   Active: ${stats.isActive}`);
      console.log(`   Tokens Earned: ${stats.tokensEarned} VARD`);
      console.log(`   Clicks: ${stats.clicks}`);
      console.log(`   Can Claim: ${stats.canClaim}`);
      break;
      
    case 'global':
      const globalStats = miningSystem.getGlobalStats();
      console.log(`\n🌍 Global Mining Stats:`);
      console.log(`   Total Tokens Earned: ${globalStats.totalTokensEarned} VARD`);
      console.log(`   Total Clicks: ${globalStats.totalClicks}`);
      console.log(`   Active Users: ${globalStats.activeUsers}`);
      console.log(`   Total Sessions: ${globalStats.totalSessions}`);
      break;
      
    default:
      console.log('🪙 Vardiano Mining System\n');
      console.log('Usage:');
      console.log('  npm run mining-start <user-id>');
      console.log('  npm run mining-click <user-id>');
      console.log('  npm run mining-claim <user-id>');
      console.log('  npm run mining-stats <user-id>');
      console.log('  npm run mining-global');
      break;
  }
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Mining system error:', error.message);
    process.exit(1);
  });
}

export default VardianoMiningSystem; 