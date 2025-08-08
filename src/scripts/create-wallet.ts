import { createSolanaConnection } from '../utils/connection';
import { generateNewKeypair, saveKeypairToFile } from '../utils/keypair';

const createWallet = async () => {
  console.log('🏗️  Creating new Solana wallet...\n');
  
  try {
    const umi = createSolanaConnection();
    
    // Generate new keypair
    const keypair = generateNewKeypair(umi);
    
    // Save to file
    saveKeypairToFile(keypair, 'wallet');
    
    console.log('\n✅ Wallet created successfully!');
    console.log(`📝 Public Key: ${keypair.publicKey}`);
    console.log('\n🚰 To get devnet SOL, run:');
    console.log(`solana airdrop 2 ${keypair.publicKey} --url devnet`);
    console.log('\nOR visit: https://faucet.solana.com/');
    console.log(`and paste your address: ${keypair.publicKey}`);
    
  } catch (error) {
    console.error('❌ Error creating wallet:', error);
  }
};

// Run if called directly
if (require.main === module) {
  createWallet();
}

export default createWallet;
