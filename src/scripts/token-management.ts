import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox';
import fs from 'fs';
import path from 'path';

interface TokenOperation {
  type: 'burn' | 'freeze' | 'unfreeze' | 'transfer-authority' | 'mint-additional';
  amount?: number;
  newAuthority?: string;
}

const tokenManagement = async (operation: TokenOperation) => {
  console.log('🛠️ Token Management Operations\n');
  
  try {
    // Load token info
    const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
    if (!fs.existsSync(tokenInfoPath)) {
      throw new Error('Token info not found. Please create a token first.');
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'));
    console.log(`📄 Managing: ${tokenInfo.name} (${tokenInfo.symbol})`);
    console.log(`🏭 Mint: ${tokenInfo.mintAddress}`);
    
    const umi = createSolanaConnection().use(mplToolbox());
    const wallet = loadKeypairFromFile(umi, 'wallet');
    
    console.log(`📤 Wallet: ${wallet.publicKey}`);
    
    switch (operation.type) {
      case 'burn':
        if (!operation.amount) {
          throw new Error('Amount required for burn operation');
        }
        await burnTokens(umi, wallet, tokenInfo, operation.amount);
        break;
        
      case 'freeze':
        await freezeAccount(umi, wallet, tokenInfo);
        break;
        
      case 'unfreeze':
        await unfreezeAccount(umi, wallet, tokenInfo);
        break;
        
      case 'transfer-authority':
        if (!operation.newAuthority) {
          throw new Error('New authority address required');
        }
        await transferAuthority(umi, wallet, tokenInfo, operation.newAuthority);
        break;
        
      case 'mint-additional':
        if (!operation.amount) {
          throw new Error('Amount required for mint operation');
        }
        await mintAdditional(umi, wallet, tokenInfo, operation.amount);
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
    
  } catch (error) {
    console.error('❌ Error in token management:', error);
    throw error;
  }
};

const burnTokens = async (umi: any, wallet: any, tokenInfo: any, amount: number) => {
  console.log(`🔥 Burning ${amount.toLocaleString()} ${tokenInfo.symbol}...`);
  
  const burnAmount = BigInt(amount * Math.pow(10, tokenInfo.decimals));
  
  const burnInstruction = {
    programId: umi.programs.get('splToken').publicKey,
    keys: [
      { pubkey: tokenInfo.tokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenInfo.mintAddress, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    ],
    data: umi.programs.get('splToken').builders.burn({
      mint: tokenInfo.mintAddress,
      token: tokenInfo.tokenAccount,
      amount: burnAmount,
      authority: wallet.publicKey,
    }).serialize(),
  };
  
  const burnTx = await umi.rpc.sendTransaction(umi.transactions.create({
    instructions: [burnInstruction]
  }));
  
  await umi.rpc.confirmTransaction(burnTx);
  
  console.log(`✅ Successfully burned ${amount.toLocaleString()} ${tokenInfo.symbol}!`);
  console.log(`🔥 Transaction: ${burnTx}`);
  
  // Update token info
  tokenInfo.burnTransactions = tokenInfo.burnTransactions || [];
  tokenInfo.burnTransactions.push({
    amount,
    transaction: burnTx.toString(),
    timestamp: new Date().toISOString()
  });
  
  fs.writeFileSync(path.join(process.cwd(), 'token-info.json'), JSON.stringify(tokenInfo, null, 2));
};

const freezeAccount = async (umi: any, wallet: any, tokenInfo: any) => {
  console.log('❄️ Freezing token account...');
  
  const freezeInstruction = {
    programId: umi.programs.get('splToken').publicKey,
    keys: [
      { pubkey: tokenInfo.tokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenInfo.mintAddress, isSigner: false, isWritable: false },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    ],
    data: umi.programs.get('splToken').builders.freezeAccount({
      account: tokenInfo.tokenAccount,
      mint: tokenInfo.mintAddress,
      authority: wallet.publicKey,
    }).serialize(),
  };
  
  const freezeTx = await umi.rpc.sendTransaction(umi.transactions.create({
    instructions: [freezeInstruction]
  }));
  
  await umi.rpc.confirmTransaction(freezeTx);
  
  console.log('✅ Account frozen successfully!');
  console.log(`❄️ Transaction: ${freezeTx}`);
  
  // Update token info
  tokenInfo.frozen = true;
  tokenInfo.freezeTransaction = freezeTx.toString();
  fs.writeFileSync(path.join(process.cwd(), 'token-info.json'), JSON.stringify(tokenInfo, null, 2));
};

const unfreezeAccount = async (umi: any, wallet: any, tokenInfo: any) => {
  console.log('🌡️ Unfreezing token account...');
  
  const thawInstruction = {
    programId: umi.programs.get('splToken').publicKey,
    keys: [
      { pubkey: tokenInfo.tokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenInfo.mintAddress, isSigner: false, isWritable: false },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    ],
    data: umi.programs.get('splToken').builders.thawAccount({
      account: tokenInfo.tokenAccount,
      mint: tokenInfo.mintAddress,
      authority: wallet.publicKey,
    }).serialize(),
  };
  
  const thawTx = await umi.rpc.sendTransaction(umi.transactions.create({
    instructions: [thawInstruction]
  }));
  
  await umi.rpc.confirmTransaction(thawTx);
  
  console.log('✅ Account unfrozen successfully!');
  console.log(`🌡️ Transaction: ${thawTx}`);
  
  // Update token info
  tokenInfo.frozen = false;
  tokenInfo.thawTransaction = thawTx.toString();
  fs.writeFileSync(path.join(process.cwd(), 'token-info.json'), JSON.stringify(tokenInfo, null, 2));
};

const transferAuthority = async (umi: any, wallet: any, tokenInfo: any, newAuthority: string) => {
  console.log(`🔄 Transferring mint authority to: ${newAuthority}`);
  
  const transferInstruction = {
    programId: umi.programs.get('splToken').publicKey,
    keys: [
      { pubkey: tokenInfo.mintAddress, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    ],
    data: umi.programs.get('splToken').builders.setAuthority({
      mint: tokenInfo.mintAddress,
      currentAuthority: wallet.publicKey,
      newAuthority: newAuthority,
      authorityType: 'MintTokens',
    }).serialize(),
  };
  
  const transferTx = await umi.rpc.sendTransaction(umi.transactions.create({
    instructions: [transferInstruction]
  }));
  
  await umi.rpc.confirmTransaction(transferTx);
  
  console.log('✅ Mint authority transferred successfully!');
  console.log(`🔄 Transaction: ${transferTx}`);
  
  // Update token info
  tokenInfo.mintAuthority = newAuthority;
  tokenInfo.authorityTransferTransaction = transferTx.toString();
  fs.writeFileSync(path.join(process.cwd(), 'token-info.json'), JSON.stringify(tokenInfo, null, 2));
};

const mintAdditional = async (umi: any, wallet: any, tokenInfo: any, amount: number) => {
  console.log(`🪙 Minting additional ${amount.toLocaleString()} ${tokenInfo.symbol}...`);
  
  const mintAmount = BigInt(amount * Math.pow(10, tokenInfo.decimals));
  
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
      amount: mintAmount,
      authority: wallet.publicKey,
    }).serialize(),
  };
  
  const mintTx = await umi.rpc.sendTransaction(umi.transactions.create({
    instructions: [mintInstruction]
  }));
  
  await umi.rpc.confirmTransaction(mintTx);
  
  console.log(`✅ Successfully minted ${amount.toLocaleString()} ${tokenInfo.symbol}!`);
  console.log(`🪙 Transaction: ${mintTx}`);
  
  // Update token info
  tokenInfo.additionalMints = tokenInfo.additionalMints || [];
  tokenInfo.additionalMints.push({
    amount,
    transaction: mintTx.toString(),
    timestamp: new Date().toISOString()
  });
  
  fs.writeFileSync(path.join(process.cwd(), 'token-info.json'), JSON.stringify(tokenInfo, null, 2));
};

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  const operation = args[0];
  const amount = args[1] ? parseInt(args[1]) : undefined;
  const newAuthority = args[2];
  
  if (!operation) {
    console.log('🛠️ Token Management Tool\n');
    console.log('Usage:');
    console.log('  npm run token-burn <amount>');
    console.log('  npm run token-freeze');
    console.log('  npm run token-unfreeze');
    console.log('  npm run token-transfer-authority <new-authority>');
    console.log('  npm run token-mint-additional <amount>');
    return;
  }
  
  let tokenOperation: TokenOperation;
  
  switch (operation) {
    case 'burn':
      tokenOperation = { type: 'burn', amount };
      break;
    case 'freeze':
      tokenOperation = { type: 'freeze' };
      break;
    case 'unfreeze':
      tokenOperation = { type: 'unfreeze' };
      break;
    case 'transfer-authority':
      tokenOperation = { type: 'transfer-authority', newAuthority };
      break;
    case 'mint-additional':
      tokenOperation = { type: 'mint-additional', amount };
      break;
    default:
      console.error('❌ Unknown operation:', operation);
      return;
  }
  
  await tokenManagement(tokenOperation);
  console.log('\n✅ Token management operation completed successfully!');
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Token management failed:', error.message);
    process.exit(1);
  });
}

export default tokenManagement; 