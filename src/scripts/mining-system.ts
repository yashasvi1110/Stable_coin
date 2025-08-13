import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import { findAssociatedTokenPda, createAssociatedToken } from '@metaplex-foundation/mpl-toolbox';
import fs from 'fs';
import path from 'path';
import { Connection, clusterApiUrl, PublicKey, Keypair } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, transfer as splTransfer } from '@solana/spl-token';

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

const loadWeb3Wallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

class VardianoMiningSystem {
  private sessions: Map<string, MiningSession> = new Map();
  private config: MiningConfig;
  private tokenInfo: any;
  private umi: any;
  private wallet: any;
  private connection!: Connection;

  constructor() {
    this.config = {
      tokensPerClick: 1,
      maxClicksPerHour: 100,
      maxTokensPerDay: 1000,
      cooldownSeconds: 3,
      miningRate: 0.1
    };
  }

  async initialize() {
    console.log('🪙 Initializing Vardiano Mining System...\n');

    const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
    if (!fs.existsSync(tokenInfoPath)) {
      throw new Error('Token info not found. Please create a token first.');
    }

    this.tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'));
    this.umi = createSolanaConnection();
    this.wallet = loadKeypairFromFile(this.umi, 'wallet');
    this.connection = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');

    console.log(`📄 Token: ${this.tokenInfo.name} (${this.tokenInfo.symbol})`);
    console.log(`🏭 Mint: ${this.tokenInfo.mintAddress}`);
    console.log(`👤 Mining Wallet: ${this.wallet.publicKey}`);

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
      const hoursSinceStart = (now.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceStart >= 24) {
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

    const secondsSinceLastClick = (now.getTime() - session.lastClickTime.getTime()) / 1000;
    if (secondsSinceLastClick < this.config.cooldownSeconds) {
      return {
        success: false,
        message: `Please wait ${this.config.cooldownSeconds - secondsSinceLastClick} more seconds before next click.`,
        tokensEarned: session.tokensEarned,
        canClaim: false
      };
    }

    const clicksThisHour = session.clicks % this.config.maxClicksPerHour;
    if (clicksThisHour >= this.config.maxClicksPerHour) {
      return {
        success: false,
        message: 'Hourly click limit reached. Please wait before continuing.',
        tokensEarned: session.tokensEarned,
        canClaim: false
      };
    }

    if (session.tokensEarned >= this.config.maxTokensPerDay) {
      return {
        success: false,
        message: 'Daily token limit reached. Come back tomorrow!',
        tokensEarned: session.tokensEarned,
        canClaim: true
      };
    }

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
      canClaim: session.tokensEarned >= 10
    };
  }

  async claimTokens(userId: string, recipientAddress: string): Promise<{ success: boolean; message: string; transaction?: string }> {
    console.log(`\n💰 Claiming tokens for user: ${userId}`);

    const session = this.sessions.get(userId);
    if (!session || session.tokensEarned < 10) {
      return {
        success: false,
        message: 'Need at least 10 tokens to claim.'
      };
    }

    try {
      const recipient = new PublicKey(recipientAddress);
      const senderWallet = loadWeb3Wallet();
      const mintPubkey = new PublicKey(this.tokenInfo.mintAddress);

      const senderAta = await getOrCreateAssociatedTokenAccount(this.connection, senderWallet, mintPubkey, senderWallet.publicKey);
      const recipientAta = await getOrCreateAssociatedTokenAccount(this.connection, senderWallet, mintPubkey, recipient);

      const rawAmount = Number(BigInt(session.tokensEarned) * 10n ** BigInt(this.tokenInfo.decimals));

      const sig = await splTransfer(
        this.connection,
        senderWallet,
        senderAta.address,
        recipientAta.address,
        senderWallet.publicKey,
        rawAmount
      );

      const claimed = session.tokensEarned;
      session.tokensEarned = 0;
      session.clicks = 0;
      this.saveSessions();

      console.log(`✅ ${claimed} ${this.tokenInfo.symbol} transferred to ${recipientAddress}`);

      return {
        success: true,
        message: `Successfully claimed and transferred ${claimed} ${this.tokenInfo.symbol}!`,
        transaction: sig
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

const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  const miningSystem = new VardianoMiningSystem();
  await miningSystem.initialize();

  switch (command) {
    case 'start': {
      const userId = args[1] || 'default-user';
      const startResult = await miningSystem.startMining(userId);
      console.log(startResult.message);
      break;
    }
    case 'click': {
      const userId = args[1] || 'default-user';
      const clickResult = await miningSystem.mineClick(userId);
      console.log(clickResult.message);
      break;
    }
    case 'claim': {
      const recipientAddress = args[1];
      const userId = args[2] || 'default-user';
      if (!recipientAddress) {
        console.log('Usage: npm run mining-claim <recipient-wallet-address> <user-id?>');
        break;
      }
      const claimResult = await miningSystem.claimTokens(userId, recipientAddress);
      console.log(claimResult.message);
      if (claimResult.transaction) {
        console.log(`🧾 TX: ${claimResult.transaction}`);
      }
      break;
    }
    case 'stats': {
      const userId = args[1] || 'default-user';
      const stats = miningSystem.getMiningStats(userId);
      console.log(`\n📊 Mining Stats for ${userId}:`);
      console.log(`   Active: ${stats.isActive}`);
      console.log(`   Tokens Earned: ${stats.tokensEarned} VARD`);
      console.log(`   Clicks: ${stats.clicks}`);
      console.log(`   Can Claim: ${stats.canClaim}`);
      break;
    }
    case 'global': {
      const globalStats = miningSystem.getGlobalStats();
      console.log(`\n🌍 Global Mining Stats:`);
      console.log(`   Total Tokens Earned: ${globalStats.totalTokensEarned} VARD`);
      console.log(`   Total Clicks: ${globalStats.totalClicks}`);
      console.log(`   Active Users: ${globalStats.activeUsers}`);
      console.log(`   Total Sessions: ${globalStats.totalSessions}`);
      break;
    }
    default: {
      console.log('🪙 Vardiano Mining System\n');
      console.log('Usage:');
      console.log('  npm run mining-start <user-id>');
      console.log('  npm run mining-click <user-id>');
      console.log('  npm run mining-claim <recipient-wallet-address> <user-id?>');
      console.log('  npm run mining-stats <user-id>');
      console.log('  npm run mining-global');
      break;
    }
  }
};

if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Mining system error:', error.message);
    process.exit(1);
  });
}

export default VardianoMiningSystem; 