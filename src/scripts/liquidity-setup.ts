import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import fs from 'fs';
import path from 'path';

interface LiquidityConfig {
  tokenAmount: number;
  solAmount: number;
  initialPrice: number; // Price in SOL per token
  dex: 'raydium' | 'orca' | 'jupiter';
}

const setupLiquidity = async (config: LiquidityConfig) => {
  console.log('💧 Liquidity Setup Guide\n');
  
  try {
    // Load token info
    const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
    if (!fs.existsSync(tokenInfoPath)) {
      throw new Error('Token info not found. Please create a token first.');
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'));
    console.log(`📄 Token: ${tokenInfo.name} (${tokenInfo.symbol})`);
    console.log(`🏭 Mint: ${tokenInfo.mintAddress}`);
    
    const umi = createSolanaConnection();
    const wallet = loadKeypairFromFile(umi, 'wallet');
    
    console.log(`👤 Wallet: ${wallet.publicKey}`);
    
    // Calculate values
    const totalValue = config.solAmount + (config.tokenAmount * config.initialPrice);
    const tokenPriceUSD = config.initialPrice * 100; // Assuming 1 SOL = $100
    
    console.log('\n💰 Liquidity Configuration:');
    console.log(`   Token Amount: ${config.tokenAmount.toLocaleString()} ${tokenInfo.symbol}`);
    console.log(`   SOL Amount: ${config.solAmount} SOL`);
    console.log(`   Initial Price: ${config.initialPrice} SOL per ${tokenInfo.symbol}`);
    console.log(`   Token Price: $${tokenPriceUSD.toFixed(4)} USD`);
    console.log(`   Total Value: ${totalValue.toFixed(2)} SOL`);
    console.log(`   DEX: ${config.dex.toUpperCase()}`);
    
    // Save liquidity config
    const liquidityInfo = {
      tokenAddress: tokenInfo.mintAddress,
      tokenSymbol: tokenInfo.symbol,
      liquidityConfig: config,
      setupDate: new Date().toISOString(),
      status: 'configured',
      nextSteps: [
        'Mint tokens to your wallet',
        'Add liquidity to DEX',
        'Set up trading pairs',
        'Market making'
      ]
    };
    
    const liquidityPath = path.join(process.cwd(), 'liquidity-config.json');
    fs.writeFileSync(liquidityPath, JSON.stringify(liquidityInfo, null, 2));
    
    console.log('\n📋 Liquidity Setup Steps:');
    console.log('\n1️⃣ **Mint Tokens**');
    console.log(`   Run: npm run mint-supply`);
    console.log(`   This will mint ${tokenInfo.initialSupply.toLocaleString()} ${tokenInfo.symbol} to your wallet`);
    
    console.log('\n2️⃣ **Add Liquidity to DEX**');
    console.log(`   Visit: https://${config.dex}.io`);
    console.log(`   Connect your wallet: ${wallet.publicKey}`);
    console.log(`   Add ${config.tokenAmount.toLocaleString()} ${tokenInfo.symbol} + ${config.solAmount} SOL`);
    
    console.log('\n3️⃣ **Set Initial Price**');
    console.log(`   Price: ${config.initialPrice} SOL per ${tokenInfo.symbol}`);
    console.log(`   USD Value: $${tokenPriceUSD.toFixed(4)}`);
    
    console.log('\n4️⃣ **Market Making**');
    console.log('   - Monitor price movements');
    console.log('   - Adjust liquidity as needed');
    console.log('   - Engage with community');
    
    console.log('\n🔗 Useful Links:');
    console.log(`   Raydium: https://raydium.io/liquidity`);
    console.log(`   Orca: https://orca.so/liquidity`);
    console.log(`   Jupiter: https://jup.ag`);
    console.log(`   DexScreener: https://dexscreener.com/solana/${tokenInfo.mintAddress}`);
    
    console.log('\n📊 Token Economics:');
    console.log(`   Total Supply: ${tokenInfo.initialSupply.toLocaleString()} ${tokenInfo.symbol}`);
    console.log(`   Initial Liquidity: ${config.tokenAmount.toLocaleString()} ${tokenInfo.symbol}`);
    console.log(`   Liquidity Percentage: ${((config.tokenAmount / tokenInfo.initialSupply) * 100).toFixed(2)}%`);
    console.log(`   Market Cap: $${(tokenInfo.initialSupply * tokenPriceUSD).toLocaleString()}`);
    
    return {
      success: true,
      liquidityConfig: config,
      tokenInfo,
      nextSteps: liquidityInfo.nextSteps
    };
    
  } catch (error) {
    console.error('❌ Error setting up liquidity:', error);
    throw error;
  }
};

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log('💧 Liquidity Setup Tool\n');
    console.log('Usage:');
    console.log('  npm run setup-liquidity-raydium');
    console.log('  npm run setup-liquidity-orca');
    console.log('  npm run setup-liquidity-custom');
    return;
  }
  
  let config: LiquidityConfig;
  
  switch (command) {
    case 'raydium':
      config = {
        tokenAmount: 10000000, // 10M tokens
        solAmount: 10, // 10 SOL
        initialPrice: 0.000001, // 0.000001 SOL per token
        dex: 'raydium'
      };
      break;
    case 'orca':
      config = {
        tokenAmount: 5000000, // 5M tokens
        solAmount: 5, // 5 SOL
        initialPrice: 0.000001, // 0.000001 SOL per token
        dex: 'orca'
      };
      break;
    case 'custom':
      const tokenAmount = args[1] ? parseInt(args[1]) : 10000000;
      const solAmount = args[2] ? parseFloat(args[2]) : 10;
      const price = args[3] ? parseFloat(args[3]) : 0.000001;
      const dex = args[4] as 'raydium' | 'orca' | 'jupiter' || 'raydium';
      
      config = {
        tokenAmount,
        solAmount,
        initialPrice: price,
        dex
      };
      break;
    default:
      console.error('❌ Unknown command:', command);
      return;
  }
  
  await setupLiquidity(config);
  console.log('\n🎉 Liquidity setup configured successfully!');
  console.log('💡 Next: Run the steps above to add actual liquidity');
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Liquidity setup failed:', error.message);
    process.exit(1);
  });
}

export default setupLiquidity; 