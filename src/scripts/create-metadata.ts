import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey, signerIdentity } from '@metaplex-foundation/umi';
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

  // If metadata already exists, skip creation
  if (tokenInfo.metadataUri) {
    console.log('ℹ️ Metadata already exists. Skipping creation.');
    console.log(`URI: ${tokenInfo.metadataUri}`);
    console.log(`Mint: ${tokenInfo.mintAddress}`);
    return;
  }

  const defaultName = tokenInfo.name || 'Vardiano';
  const defaultSymbol = tokenInfo.symbol || 'VARD';
  const defaultDescription = tokenInfo.description || 'Vardiano token on Solana';

  const umi = createSolanaConnection();
  
  // Check if mint authority was transferred
  let mintAuthority = loadKeypairFromFile(umi, 'wallet');
  if (tokenInfo.mintAuthority && tokenInfo.mintAuthority !== tokenInfo.tokenAccount) {
    // Use freeze-authority keypair as mint authority
    try {
      mintAuthority = loadKeypairFromFile(umi, 'freeze-authority');
      console.log(`Using transferred mint authority: ${mintAuthority.publicKey}`);
    } catch (e) {
      console.log('Using wallet as fallback authority');
    }
  }
  
  umi.use(signerIdentity(mintAuthority));

  // Build metadata JSON
  const metadataJson = {
    name: defaultName,
    symbol: defaultSymbol,
    description: defaultDescription,
    image: '',
    external_url: '',
    attributes: [],
    properties: {
      files: [],
      category: 'image',
    },
  };

  console.log('📤 Uploading metadata JSON to Irys...');
  const metadataUri = await umi.uploader.uploadJson(metadataJson);
  console.log(`✅ Uploaded. URI: ${metadataUri}`);

  console.log('🧾 Creating metadata account (V3)');
  const { signature } = await createMetadataAccountV3(umi, {
    mint: publicKey(tokenInfo.mintAddress),
    mintAuthority: mintAuthority,
    payer: mintAuthority,
    updateAuthority: mintAuthority.publicKey,
    data: {
      name: defaultName,
      symbol: defaultSymbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  }).sendAndConfirm(umi);

  console.log(`🎉 Metadata created. TX: ${signature}`);

  // Persist
  tokenInfo.metadataUri = metadataUri;
  tokenInfo.createMetadataTx = signature.toString();
  fs.writeFileSync(tokenInfoPath, JSON.stringify(tokenInfo, null, 2));
  console.log('💾 Updated token-info.json');

  console.log(`🔍 View token: https://explorer.solana.com/address/${tokenInfo.mintAddress}?cluster=devnet`);
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Metadata creation failed:', e.message || e);
    process.exit(1);
  });
}

export {};
