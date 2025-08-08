import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { generateSigner } from '@metaplex-foundation/umi';
import fs from 'fs';
import path from 'path';

const mintInitialSupply = async () => {
  console.log('🪙 Minting initial supply to your wallet...\n');
  
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
    
    console.log(`📤 Wallet: ${wallet.publicKey}`);
    
    // Calculate supply amount
    const supplyAmount = BigInt(tokenInfo.initialSupply * Math.pow(10, tokenInfo.decimals));
    console.log(`💰 Minting: ${tokenInfo.initialSupply.toLocaleString()} ${tokenInfo.symbol}`);
    
    // Create mint instruction
    const mintInstruction = {
      programId: umi.programs.get('splToken').publicKey,
      keys: [
        { pubkey: tokenInfo.mintAddress, isSigner: false, isWritable: true },
        { pubkey: tokenInfo.tokenAccount, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
      ],
      data: umi.programs.get('splToken').builders.mintTo({
        mint: tokenInfo.mintAddress,
        token: tokenInfo.tokenAccount,
        amount: supplyAmount,
        authority: wallet.publicKey,
      }).serialize(),
    };
    
    console.log('\n🔄 Sending mint transaction...');
    const mintTx = await umi.rpc.sendTransaction(umi.transactions.create({
      instructions: [mintInstruction]
    }));
    
    await umi.rpc.confirmTransaction(mintTx);
    
    console.log(`✅ Successfully minted ${tokenInfo.initialSupply.toLocaleString()} ${tokenInfo.symbol}!`);
    console.log(`💰 Transaction: ${mintTx}`);
    
    // Update token info
    tokenInfo.mintTransaction = mintTx.toString();
    tokenInfo.mintedAt = new Date().toISOString();
    tokenInfo.currentSupply = tokenInfo.initialSupply;
    
    fs.writeFileSync(tokenInfoPath, JSON.stringify(tokenInfo, null, 2));
    
    console.log('\n📊 Updated Token Information:');
    console.log(`   Current Supply: ${tokenInfo.initialSupply.toLocaleString()} ${tokenInfo.symbol}`);
    console.log(`   Token Account: ${tokenInfo.tokenAccount}`);
    console.log(`   Info updated in: ${tokenInfoPath}`);
    
    return { success: true, transaction: mintTx };
    
  } catch (error) {
    console.error('❌ Error minting supply:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  mintInitialSupply()
    .then((result) => {
      console.log('\n🎉 Minting completed successfully!');
    })
    .catch((error) => {
      console.error('\n💥 Minting failed:', error.message);
      process.exit(1);
    });
}

export default mintInitialSupply; 