import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';

const checkBalance = async () => {
  console.log('💰 Checking wallet balance...\n');
  
  try {
    const umi = createSolanaConnection();
    
    // Load wallet
    const wallet = loadKeypairFromFile(umi, 'wallet');
    
    console.log(`📤 Wallet address: ${wallet.publicKey}`);
    
    // Get balance
    const balance = await umi.rpc.getBalance(wallet.publicKey);
    const solBalance = Number(balance.basisPoints) / 1e9; // Convert lamports to SOL
    
    console.log(`💰 Balance: ${solBalance.toFixed(4)} SOL`);
    
    if (solBalance < 0.01) {
      console.log('\n⚠️  Warning: Low balance detected!');
      console.log('You need at least 0.01 SOL for transaction fees.');
      console.log('\n🚰 To get devnet SOL:');
      console.log(`1. Visit: https://faucet.solana.com/`);
      console.log(`2. Paste your address: ${wallet.publicKey}`);
      console.log('3. Or use CLI: solana airdrop 2 <address> --url devnet');
    } else {
      console.log('\n✅ Sufficient balance for token creation!');
    }
    
    return { balance: solBalance, address: wallet.publicKey.toString() };
    
  } catch (error) {
    console.error('❌ Error checking balance:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  checkBalance()
    .then((result) => {
      console.log('\n✅ Balance check completed!');
    })
    .catch((error) => {
      console.error('\n💥 Balance check failed:', error.message);
      process.exit(1);
    });
}

export default checkBalance; 