import { Connection, clusterApiUrl, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import fs from 'fs';
import path from 'path';

interface TokenInfo {
  mintAddress: string;
  tokenAccount?: string;
  name?: string;
  symbol?: string;
  description?: string;
  metadataUri?: string;
  createMetadataTx?: string;
  mintAuthority?: string;
}

const main = async () => {
  console.log('🖼️ Creating on-chain metadata for the current mint');

  const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
  if (!fs.existsSync(tokenInfoPath)) {
    throw new Error('token-info.json not found. Create a token first.');
  }

  const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8')) as TokenInfo;

  // Check if metadata already exists
  if (tokenInfo.metadataUri && tokenInfo.metadataUri !== 'https://arweave.net/placeholder-1755935180466') {
    console.log('ℹ️ Metadata already exists. Skipping creation.');
    console.log(`URI: ${tokenInfo.metadataUri}`);
    console.log(`Mint: ${tokenInfo.mintAddress}`);
    return;
  }

  if (!tokenInfo.mintAuthority) {
    throw new Error('mintAuthority not found in token-info.json. Cannot create metadata.');
  }

  const defaultName = tokenInfo.name || 'Vardiano';
  const defaultSymbol = tokenInfo.symbol || 'VARD';
  const defaultDescription = tokenInfo.description || 'Vardiano token on Solana';

  console.log(`🔑 Using mint authority: ${tokenInfo.mintAuthority}`);
  console.log(`🪙 Token: ${defaultName} (${defaultSymbol})`);

  // Load the mint authority keypair
  const walletPath = path.join(process.cwd(), 'keypairs', 'wallet.json');
  if (!fs.existsSync(walletPath)) {
    throw new Error('wallet.json not found. Cannot sign metadata creation.');
  }

  const secret = new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')));
  const mintAuthority = Keypair.fromSecretKey(secret);

  // Verify this is the correct mint authority
  if (mintAuthority.publicKey.toBase58() !== tokenInfo.mintAuthority) {
    throw new Error(`Mint authority mismatch! Expected: ${tokenInfo.mintAuthority}, Got: ${mintAuthority.publicKey.toBase58()}`);
  }

  console.log('✅ Mint authority verified successfully');

  // Create connection
  const connection = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');

  // Create metadata account
  const mint = new PublicKey(tokenInfo.mintAddress);
  const metadataAccount = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
      mint.toBuffer(),
    ],
    new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
  )[0];

  console.log(`📝 Creating metadata account: ${metadataAccount.toBase58()}`);

  // Create metadata instruction using the correct approach
  const createMetadataInstruction = createMetadataAccountV3({
    metadata: metadataAccount,
    mint: mint,
    mintAuthority: mintAuthority.publicKey,
    payer: mintAuthority.publicKey,
    updateAuthority: mintAuthority.publicKey,
  }, {
    createMetadataAccountArgsV3: {
      data: {
        name: defaultName,
        symbol: defaultSymbol,
        uri: 'https://arweave.net/placeholder-1755935180466', // Placeholder URI
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    },
  });

  // Convert the instruction to a regular TransactionInstruction
  const instruction = createMetadataInstruction.instruction;
  
  // Create and send transaction
  const transaction = new Transaction().add(instruction);
  
  try {
    console.log('🚀 Sending metadata creation transaction...');
    const signature = await connection.sendTransaction(transaction, [mintAuthority]);
    
    console.log('✅ Metadata created successfully!');
    console.log(`Transaction: ${signature}`);
    
    // Update token info
    tokenInfo.metadataUri = 'https://arweave.net/placeholder-1755935180466';
    tokenInfo.createMetadataTx = signature;
    
    fs.writeFileSync(tokenInfoPath, JSON.stringify(tokenInfo, null, 2));
    console.log('💾 Updated token-info.json with metadata info');
    
    console.log(`\n🔍 View token: https://explorer.solana.com/address/${tokenInfo.mintAddress}?cluster=devnet`);
    console.log(`🔍 View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    
  } catch (error) {
    console.error('❌ Failed to create metadata:', error);
    throw error;
  }
};

if (require.main === module) {
  main().catch((e: any) => {
    console.error('❌ Failed:', e?.message || e);
    process.exit(1);
  });
}
