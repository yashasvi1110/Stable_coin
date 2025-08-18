import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const main = async () => {
  console.log('🔑 Creating Mainnet Wallet\n');
  
  try {
    // Create new mainnet wallet
    const mainnetWallet = Keypair.generate();
    
    // Ensure keypairs directory exists
    const keypairsDir = path.join(process.cwd(), 'keypairs');
    if (!fs.existsSync(keypairsDir)) {
      fs.mkdirSync(keypairsDir, { recursive: true });
    }
    
    // Save mainnet wallet
    const walletPath = path.join(keypairsDir, 'mainnet-wallet.json');
    fs.writeFileSync(walletPath, JSON.stringify(Array.from(mainnetWallet.secretKey)));
    
    console.log('✅ Mainnet wallet created successfully!');
    console.log(`🔑 Public Key: ${mainnetWallet.publicKey.toBase58()}`);
    console.log(`💾 Saved to: ${walletPath}`);
    
    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   • This wallet will be used for MAINNET deployment');
    console.log('   • Keep the private key secure and backed up');
    console.log('   • Never share the private key with anyone');
    console.log('   • Consider using a hardware wallet for production');
    
    console.log('\n💰 FUNDING REQUIREMENTS:');
    console.log('   • Minimum SOL needed: 0.1 SOL');
    console.log('   • Recommended: 1-5 SOL for deployment + fees');
    console.log('   • You can buy SOL from exchanges like Binance, Coinbase, etc.');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Fund this wallet with SOL from an exchange');
    console.log('   2. Configure mainnet settings: npm run configure-mainnet');
    console.log('   3. Deploy to mainnet: npm run deploy-mainnet');
    
    console.log('\n🔗 Useful Links:');
    console.log('   • Solana Explorer: https://explorer.solana.com/');
    console.log('   • Buy SOL: https://www.binance.com/ or https://www.coinbase.com/');
    console.log('   • Hardware Wallets: https://ledger.com/ or https://trezor.io/');
    
    return {
      publicKey: mainnetWallet.publicKey.toBase58(),
      walletPath
    };
    
  } catch (error) {
    console.error('❌ Failed to create mainnet wallet:', error);
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