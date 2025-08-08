import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import { findAssociatedTokenPda, createAssociatedToken } from '@metaplex-foundation/mpl-toolbox';
import fs from 'fs';
import path from 'path';

const transferTokens = async (recipientAddress: string, amount: number) => {
  console.log('💸 Token Transfer Tool\n');
  
  try {
    // Load token info
    const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
    if (!fs.existsSync(tokenInfoPath)) {
      throw new Error('Token info not found. Please create a token first.');
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'));
    console.log(`📄 Token: ${tokenInfo.name} (${tokenInfo.symbol})`);
    console.log(`🏭 Mint: ${tokenInfo.mintAddress}`);
    console.log(`📤 From: ${tokenInfo.tokenAccount}`);
    console.log(`📥 To: ${recipientAddress}`);
    console.log(`💰 Amount: ${amount.toLocaleString()} ${tokenInfo.symbol}`);
    
    const umi = createSolanaConnection();
    const wallet = loadKeypairFromFile(umi, 'wallet');
    
    console.log(`👤 Sender: ${wallet.publicKey}`);
    
    // Find recipient's token account
    const recipientTokenAccount = findAssociatedTokenPda(umi, {
      mint: tokenInfo.mintAddress,
      owner: recipientAddress,
    });
    
    console.log(`📥 Recipient token account: ${recipientTokenAccount[0]}`);
    
    // Create recipient token account if it doesn't exist
    try {
      await createAssociatedToken(umi, {
        mint: tokenInfo.mintAddress,
        owner: recipientAddress,
      }).sendAndConfirm(umi);
      
      console.log('✅ Recipient token account created');
    } catch (error) {
      console.log('ℹ️ Recipient token account may already exist');
    }
    
    // Calculate transfer amount
    const transferAmount = BigInt(amount * Math.pow(10, tokenInfo.decimals));
    
    // Create transfer instruction
    const transferInstruction = {
      programId: umi.programs.get('splToken').publicKey,
      keys: [
        { pubkey: tokenInfo.tokenAccount, isSigner: false, isWritable: true },
        { pubkey: recipientTokenAccount[0], isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
      ],
      data: umi.programs.get('splToken').builders.transfer({
        source: tokenInfo.tokenAccount,
        destination: recipientTokenAccount[0],
        amount: transferAmount,
        authority: wallet.publicKey,
      }).serialize(),
    };
    
    console.log('\n🔄 Sending transfer transaction...');
    const transferTx = await umi.rpc.sendTransaction(umi.transactions.create({
      instructions: [transferInstruction]
    }));
    
    await umi.rpc.confirmTransaction(transferTx);
    
    console.log(`✅ Successfully transferred ${amount.toLocaleString()} ${tokenInfo.symbol}!`);
    console.log(`💸 Transaction: ${transferTx}`);
    
    // Update token info with transfer history
    tokenInfo.transfers = tokenInfo.transfers || [];
    tokenInfo.transfers.push({
      to: recipientAddress,
      amount,
      transaction: transferTx.toString(),
      timestamp: new Date().toISOString()
    });
    
    fs.writeFileSync(tokenInfoPath, JSON.stringify(tokenInfo, null, 2));
    
    console.log('\n📊 Transfer Information:');
    console.log(`   Recipient: ${recipientAddress}`);
    console.log(`   Amount: ${amount.toLocaleString()} ${tokenInfo.symbol}`);
    console.log(`   Transaction: ${transferTx}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${transferTx}?cluster=devnet`);
    
    return { success: true, transaction: transferTx };
    
  } catch (error) {
    console.error('❌ Error transferring tokens:', error);
    throw error;
  }
};

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  const recipientAddress = args[0];
  const amount = args[1] ? parseInt(args[1]) : undefined;
  
  if (!recipientAddress || !amount) {
    console.log('💸 Token Transfer Tool\n');
    console.log('Usage: npm run transfer-token <recipient-address> <amount>');
    console.log('\nExample: npm run transfer-token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU 1000');
    return;
  }
  
  await transferTokens(recipientAddress, amount);
  console.log('\n🎉 Transfer completed successfully!');
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Transfer failed:', error.message);
    process.exit(1);
  });
}

export default transferTokens; 