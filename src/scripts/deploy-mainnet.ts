import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import { createMint as splCreateMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

interface MainnetConfig {
  rpcUrl: string;
  network: 'mainnet-beta';
  tokenName: string;
  tokenSymbol: string;
  description: string;
  decimals: number;
  initialSupply: number;
  logoUrl: string;
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
}

class MainnetDeployer {
  private connection: Connection;
  private wallet: Keypair;
  private config: MainnetConfig;

  constructor() {
    this.connection = new Connection(process.env.MAINNET_RPC_URL || clusterApiUrl('mainnet-beta'), 'confirmed');
  }

  async initialize() {
    console.log('🚀 Vardiano Mainnet Deployment System\n');
    
    // Load mainnet wallet
    const mainnetWalletPath = path.join(process.cwd(), 'keypairs', 'mainnet-wallet.json');
    if (!fs.existsSync(mainnetWalletPath)) {
      throw new Error('Mainnet wallet not found. Create one with: npm run create-mainnet-wallet');
    }
    
    this.wallet = loadKeypairFromFile(null, 'mainnet-wallet');
    
    // Load mainnet config
    const configPath = path.join(process.cwd(), 'mainnet-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Mainnet config not found. Create one with: npm run configure-mainnet');
    }
    
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    console.log(`📄 Token: ${this.config.tokenName} (${this.config.tokenSymbol})`);
    console.log(`🌐 Network: ${this.config.network}`);
    console.log(`👤 Wallet: ${this.wallet.publicKey.toBase58()}`);
    
    // Check mainnet balance
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    const solBalance = balance / 1e9;
    
    if (solBalance < 0.1) {
      throw new Error(`Insufficient SOL balance: ${solBalance.toFixed(4)} SOL. Need at least 0.1 SOL for mainnet deployment.`);
    }
    
    console.log(`💰 SOL Balance: ${solBalance.toFixed(4)} SOL`);
  }

  async deployToken() {
    console.log('\n🏭 Deploying token to mainnet...');
    
    try {
      // Create freeze authority for mainnet
      const freezeAuthority = Keypair.generate();
      const freezeAuthPath = path.join(process.cwd(), 'keypairs', 'mainnet-freeze-authority.json');
      fs.writeFileSync(freezeAuthPath, JSON.stringify(Array.from(freezeAuthority.secretKey)));
      
      console.log(`🧑‍⚖️ Freeze authority: ${freezeAuthority.publicKey.toBase58()}`);
      
      // Create mainnet mint
      const mint = await splCreateMint(
        this.connection,
        this.wallet,
        this.wallet.publicKey,
        freezeAuthority.publicKey,
        this.config.decimals
      );
      
      console.log(`✅ Mint created: ${mint.toBase58()}`);
      
      // Create token account
      const ata = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        mint,
        this.wallet.publicKey
      );
      
      console.log(`✅ Token account: ${ata.address.toBase58()}`);
      
      // Mint initial supply
      const initialAmount = Number(BigInt(this.config.initialSupply) * 10n ** BigInt(this.config.decimals));
      await mintTo(
        this.connection,
        this.wallet,
        mint,
        ata.address,
        this.wallet.publicKey,
        initialAmount
      );
      
      console.log(`✅ Initial supply minted: ${this.config.initialSupply.toLocaleString()} ${this.config.tokenSymbol}`);
      
      // Save mainnet token info
      const mainnetInfo = {
        mintAddress: mint.toBase58(),
        tokenAccount: ata.address.toBase58(),
        name: this.config.tokenName,
        symbol: this.config.tokenSymbol,
        description: this.config.description,
        decimals: this.config.decimals,
        initialSupply: this.config.initialSupply,
        network: 'mainnet-beta',
        freezeAuthority: freezeAuthority.publicKey.toBase58(),
        deployedAt: new Date().toISOString(),
        logoUrl: this.config.logoUrl,
        website: this.config.website,
        social: {
          twitter: this.config.twitter,
          telegram: this.config.telegram,
          discord: this.config.discord
        }
      };
      
      const mainnetInfoPath = path.join(process.cwd(), 'mainnet-token-info.json');
      fs.writeFileSync(mainnetInfoPath, JSON.stringify(mainnetInfo, null, 2));
      
      console.log('\n🎉 Mainnet Token Deployed Successfully!');
      console.log(`🔍 Explorer: https://explorer.solana.com/address/${mint.toBase58()}`);
      console.log(`📄 Info saved to: mainnet-token-info.json`);
      
      return mainnetInfo;
      
    } catch (error) {
      console.error('❌ Token deployment failed:', error);
      throw error;
    }
  }

  async deployMetadata() {
    console.log('\n📤 Deploying metadata to mainnet...');
    
    try {
      const umi = createSolanaConnection('mainnet-beta');
      const wallet = loadKeypairFromFile(umi, 'mainnet-wallet');
      umi.use(signerIdentity(wallet));
      
      // Create metadata
      const metadata = {
        name: this.config.tokenName,
        symbol: this.config.tokenSymbol,
        description: this.config.description,
        image: this.config.logoUrl,
        external_url: this.config.website,
        attributes: [
          { trait_type: 'Network', value: 'Mainnet' },
          { trait_type: 'Type', value: 'SPL Token' },
          { trait_type: 'Deployed', value: new Date().toISOString() }
        ],
        properties: {
          files: [
            {
              type: 'image/png',
              uri: this.config.logoUrl
            }
          ],
          category: 'image',
          website: this.config.website,
          social: {
            twitter: this.config.twitter,
            telegram: this.config.telegram,
            discord: this.config.discord
          }
        }
      };
      
      // Upload metadata
      const metadataUri = await umi.uploader.uploadJson(metadata);
      console.log(`✅ Metadata uploaded: ${metadataUri}`);
      
      // Update mainnet info with metadata
      const mainnetInfoPath = path.join(process.cwd(), 'mainnet-token-info.json');
      const mainnetInfo = JSON.parse(fs.readFileSync(mainnetInfoPath, 'utf-8'));
      mainnetInfo.metadataUri = metadataUri;
      fs.writeFileSync(mainnetInfoPath, JSON.stringify(mainnetInfo, null, 2));
      
      return metadataUri;
      
    } catch (error) {
      console.error('❌ Metadata deployment failed:', error);
      throw error;
    }
  }

  async deployLiquidity() {
    console.log('\n💧 Setting up mainnet liquidity...');
    
    try {
      // This would integrate with actual DEX protocols
      // For now, we'll create a liquidity configuration
      const liquidityConfig = {
        tokenAddress: '', // Will be filled from mainnet info
        tokenSymbol: this.config.tokenSymbol,
        dex: 'raydium',
        initialLiquidity: {
          tokenAmount: this.config.initialSupply * 0.1, // 10% of supply
          solAmount: 10, // 10 SOL
          targetPrice: 0.001 // $0.001 per token
        },
        setupInstructions: [
          '1. Visit Raydium Liquidity: https://raydium.io/liquidity',
          '2. Connect your mainnet wallet',
          '3. Add liquidity with the specified amounts',
          '4. Set initial price and launch trading'
        ]
      };
      
      const liquidityPath = path.join(process.cwd(), 'mainnet-liquidity-config.json');
      fs.writeFileSync(liquidityPath, JSON.stringify(liquidityConfig, null, 2));
      
      console.log('✅ Liquidity configuration created');
      console.log('📄 Check mainnet-liquidity-config.json for setup instructions');
      
      return liquidityConfig;
      
    } catch (error) {
      console.error('❌ Liquidity setup failed:', error);
      throw error;
    }
  }

  async runFullDeployment() {
    try {
      await this.initialize();
      
      console.log('\n🚀 Starting mainnet deployment...\n');
      
      // Step 1: Deploy token
      const tokenInfo = await this.deployToken();
      
      // Step 2: Deploy metadata
      const metadataUri = await this.deployMetadata();
      
      // Step 3: Setup liquidity
      const liquidityConfig = await this.deployLiquidity();
      
      console.log('\n🎉 PHASE 4 COMPLETE! Mainnet deployment successful!');
      console.log('\n📊 Deployment Summary:');
      console.log(`   Token: ${tokenInfo.name} (${tokenInfo.symbol})`);
      console.log(`   Mint: ${tokenInfo.mintAddress}`);
      console.log(`   Network: ${tokenInfo.network}`);
      console.log(`   Metadata: ${metadataUri}`);
      console.log(`   Liquidity: Configured for Raydium`);
      
      console.log('\n🔗 Next Steps:');
      console.log('   1. Add liquidity to Raydium');
      console.log('   2. Launch marketing campaign');
      console.log('   3. Monitor trading activity');
      console.log('   4. Engage with community');
      
      return {
        success: true,
        tokenInfo,
        metadataUri,
        liquidityConfig
      };
      
    } catch (error) {
      console.error('❌ Mainnet deployment failed:', error);
      throw error;
    }
  }
}

const main = async () => {
  try {
    const deployer = new MainnetDeployer();
    await deployer.runFullDeployment();
    
  } catch (error) {
    console.error('❌ Failed:', error?.message || error);
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