import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { getMint, getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

interface SecurityTest {
  name: string;
  description: string;
  test: () => Promise<boolean>;
  critical: boolean;
}

class VardianoSecurityTester {
  private tokenInfo: any;
  private umi: any;
  private wallet: any;
  private connection: Connection;

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  }

  async initialize() {
    console.log('🔒 Vardiano Security Testing Suite\n');
    
    const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
    if (!fs.existsSync(tokenInfoPath)) {
      throw new Error('Token info not found. Please create a token first.');
    }
    
    this.tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'));
    this.umi = createSolanaConnection();
    this.wallet = loadKeypairFromFile(this.umi, 'wallet');
    
    console.log(`📄 Token: ${this.tokenInfo.name} (${this.tokenInfo.symbol})`);
    console.log(`🏭 Mint: ${this.tokenInfo.mintAddress}`);
    console.log(`👤 Wallet: ${this.wallet.publicKey}`);
  }

  private async testWalletSecurity(): Promise<boolean> {
    try {
      // Check if wallet file exists and is readable
      const walletPath = path.join(process.cwd(), 'keypairs', 'wallet.json');
      if (!fs.existsSync(walletPath)) {
        console.log('❌ Wallet file not found');
        return false;
      }
      
      // Check wallet balance
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      if (balance < 0.01 * 1e9) { // Less than 0.01 SOL
        console.log('⚠️  Low wallet balance - may cause transaction failures');
        return false;
      }
      
      console.log('✅ Wallet security checks passed');
      return true;
    } catch (error) {
      console.log('❌ Wallet security test failed:', error);
      return false;
    }
  }

  private async testTokenIntegrity(): Promise<boolean> {
    try {
      const mint = new PublicKey(this.tokenInfo.mintAddress);
      const mintInfo = await getMint(this.connection, mint);
      
      // Verify token properties
      if (mintInfo.decimals !== this.tokenInfo.decimals) {
        console.log('❌ Token decimals mismatch');
        return false;
      }
      
      if (mintInfo.supply !== BigInt(this.tokenInfo.initialSupply) * BigInt(10 ** this.tokenInfo.decimals)) {
        console.log('❌ Token supply mismatch');
        return false;
      }
      
      console.log('✅ Token integrity checks passed');
      return true;
    } catch (error) {
      console.log('❌ Token integrity test failed:', error);
      return false;
    }
  }

  private async testAuthoritySecurity(): Promise<boolean> {
    try {
      // Check if freeze authority exists and is valid
      if (this.tokenInfo.freezeAuthority) {
        const freezeAuth = new PublicKey(this.tokenInfo.freezeAuthority);
        if (freezeAuth.equals(this.wallet.publicKey)) {
          console.log('⚠️  Freeze authority is same as wallet - consider separating');
        } else {
          console.log('✅ Freeze authority properly separated');
        }
      }
      
      // Check mint authority
      if (this.tokenInfo.mintAuthority && this.tokenInfo.mintAuthority !== this.wallet.publicKey.toString()) {
        console.log('✅ Mint authority transferred to separate wallet');
      } else {
        console.log('⚠️  Mint authority still in main wallet');
      }
      
      return true;
    } catch (error) {
      console.log('❌ Authority security test failed:', error);
      return false;
    }
  }

  private async testMetadataSecurity(): Promise<boolean> {
    try {
      if (!this.tokenInfo.metadataUri) {
        console.log('⚠️  No metadata URI found');
        return false;
      }
      
      // Check if metadata is accessible
      const response = await fetch(this.tokenInfo.metadataUri);
      if (!response.ok) {
        console.log('❌ Metadata URI not accessible');
        return false;
      }
      
      const metadata = await response.json();
      if (!metadata.name || !metadata.symbol) {
        console.log('❌ Metadata missing required fields');
        return false;
      }
      
      console.log('✅ Metadata security checks passed');
      return true;
    } catch (error) {
      console.log('❌ Metadata security test failed:', error);
      return false;
    }
  }

  private async testNetworkSecurity(): Promise<boolean> {
    try {
      // Check if we're on devnet (safer for testing)
      const endpoint = this.connection.rpcEndpoint;
      if (endpoint.includes('devnet')) {
        console.log('✅ Running on devnet (safe for testing)');
        return true;
      } else if (endpoint.includes('mainnet')) {
        console.log('⚠️  Running on mainnet (use with caution)');
        return true;
      } else {
        console.log('❌ Unknown network endpoint');
        return false;
      }
    } catch (error) {
      console.log('❌ Network security test failed:', error);
      return false;
    }
  }

  async runAllTests(): Promise<{ passed: number; total: number; critical: boolean }> {
    const tests: SecurityTest[] = [
      {
        name: 'Wallet Security',
        description: 'Check wallet file integrity and balance',
        test: () => this.testWalletSecurity(),
        critical: true
      },
      {
        name: 'Token Integrity',
        description: 'Verify token properties and supply',
        test: () => this.testTokenIntegrity(),
        critical: true
      },
      {
        name: 'Authority Security',
        description: 'Check authority separation and permissions',
        test: () => this.testAuthoritySecurity(),
        critical: false
      },
      {
        name: 'Metadata Security',
        description: 'Verify metadata accessibility and integrity',
        test: () => this.testMetadataSecurity(),
        critical: false
      },
      {
        name: 'Network Security',
        description: 'Check network endpoint safety',
        test: () => this.testNetworkSecurity(),
        critical: false
      }
    ];

    console.log('🚀 Running Security Tests...\n');
    
    let passed = 0;
    let total = tests.length;
    let critical = true;

    for (const test of tests) {
      console.log(`🔍 ${test.name}: ${test.description}`);
      try {
        const result = await test.test();
        if (result) {
          passed++;
        } else if (test.critical) {
          critical = false;
        }
      } catch (error) {
        console.log(`❌ ${test.name} failed with error:`, error);
        if (test.critical) {
          critical = false;
        }
      }
      console.log('');
    }

    // Generate security report
    const securityReport = {
      timestamp: new Date().toISOString(),
      token: this.tokenInfo.name,
      mint: this.tokenInfo.mintAddress,
      testsPassed: passed,
      totalTests: total,
      criticalIssues: !critical,
      recommendations: []
    };

    if (passed < total) {
      securityReport.recommendations.push('Run failed tests individually to identify issues');
    }
    
    if (!critical) {
      securityReport.recommendations.push('Critical security issues detected - resolve before production use');
    }

    // Save security report
    const reportPath = path.join(process.cwd(), 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(securityReport, null, 2));

    console.log('📊 Security Test Results:');
    console.log(`   Passed: ${passed}/${total}`);
    console.log(`   Critical Issues: ${critical ? 'None' : 'Detected'}`);
    console.log(`   Report saved to: security-report.json`);

    return { passed, total, critical };
  }
}

const main = async () => {
  try {
    const tester = new VardianoSecurityTester();
    await tester.initialize();
    await tester.runAllTests();
    
    console.log('\n✅ Phase 2 Security Testing Complete!');
    
  } catch (error) {
    console.error('❌ Security testing failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Failed:', e?.message || e);
    process.exit(1);
  });
}

export {}; 