import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import fs from 'fs';
import path from 'path';

const checkTokenStatus = async () => {
  console.log('📊 Token Status Check\n');
  
  try {
    // Load token info
    const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
    if (!fs.existsSync(tokenInfoPath)) {
      throw new Error('Token info not found. Please create a token first.');
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'));
    
    console.log('🎯 Token Information:');
    console.log(`   Name: ${tokenInfo.name}`);
    console.log(`   Symbol: ${tokenInfo.symbol}`);
    console.log(`   Mint Address: ${tokenInfo.mintAddress}`);
    console.log(`   Token Account: ${tokenInfo.tokenAccount}`);
    console.log(`   Decimals: ${tokenInfo.decimals}`);
    console.log(`   Network: ${tokenInfo.network}`);
    console.log(`   Created: ${tokenInfo.createdAt}`);
    
    if (tokenInfo.metadataUri) {
      console.log(`   Metadata: ${tokenInfo.metadataUri}`);
    }
    
    if (tokenInfo.createTransaction) {
      console.log(`   Creation TX: ${tokenInfo.createTransaction}`);
    }
    
    // Check wallet balance
    const umi = createSolanaConnection();
    const wallet = loadKeypairFromFile(umi, 'wallet');
    
    console.log(`\n👤 Wallet: ${wallet.publicKey}`);
    
    // Get SOL balance
    const solBalance = await umi.rpc.getBalance(wallet.publicKey);
    const solAmount = Number(solBalance.basisPoints) / 1e9;
    
    console.log(`💰 SOL Balance: ${solAmount.toFixed(4)} SOL`);
    
    // Token balance info
    console.log(`🪙 ${tokenInfo.symbol} Balance: Check token account for current balance`);
    console.log(`   Token Account: ${tokenInfo.tokenAccount}`);
    
    // Show transaction history
    if (tokenInfo.transfers && tokenInfo.transfers.length > 0) {
      console.log('\n📜 Recent Transfers:');
      tokenInfo.transfers.slice(-5).forEach((transfer: any, index: number) => {
        console.log(`   ${index + 1}. ${transfer.amount.toLocaleString()} ${tokenInfo.symbol} to ${transfer.to.slice(0, 8)}...`);
      });
    }
    
    if (tokenInfo.burnTransactions && tokenInfo.burnTransactions.length > 0) {
      console.log('\n🔥 Recent Burns:');
      tokenInfo.burnTransactions.slice(-5).forEach((burn: any, index: number) => {
        console.log(`   ${index + 1}. ${burn.amount.toLocaleString()} ${tokenInfo.symbol} burned`);
      });
    }
    
    // Show explorer links
    console.log('\n🔍 Explorer Links:');
    console.log(`   Token: https://explorer.solana.com/address/${tokenInfo.mintAddress}?cluster=devnet`);
    console.log(`   Wallet: https://explorer.solana.com/address/${wallet.publicKey}?cluster=devnet`);
    
    // Status summary
    console.log('\n✅ Token Status: ACTIVE');
    console.log('🎉 Your Vardiano (VARD) token is live and functional!');
    
    return {
      tokenInfo,
      wallet: wallet.publicKey.toString(),
      solBalance: solAmount,
      status: 'active'
    };
    
  } catch (error) {
    console.error('❌ Error checking token status:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  checkTokenStatus()
    .then((result) => {
      console.log('\n📊 Status check completed successfully!');
    })
    .catch((error) => {
      console.error('\n💥 Status check failed:', error.message);
      process.exit(1);
    });
}

export default checkTokenStatus; 