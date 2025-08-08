import { createFungible } from '@metaplex-foundation/mpl-token-metadata';
import { findAssociatedTokenPda, createAssociatedToken, mintTokensTo } from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, percentAmount, signerIdentity } from '@metaplex-foundation/umi';
import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import fs from 'fs';
import path from 'path';

let TOKEN_CONFIG = {
  name: 'Vardiano',
  symbol: 'VARD',
  description: 'Vardiano token',
  decimals: 9,
  initialSupply: 100000,
};

try {
  const configPath = path.join(process.cwd(), 'token-config.json');
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    TOKEN_CONFIG = { ...TOKEN_CONFIG, ...configData };
  }
} catch (_) {}

const main = async () => {
  console.log('🪙 Creating and minting Vardiano in one flow...\n');
  const umi = createSolanaConnection();

  const wallet = loadKeypairFromFile(umi, 'wallet');
  umi.use(signerIdentity(wallet));
  console.log(`📤 Payer: ${wallet.publicKey}`);

  // Use a fresh mint
  const mintSigner = generateSigner(umi);
  console.log(`🏭 New mint: ${mintSigner.publicKey}`);

  // Upload minimal metadata
  const metadata = {
    name: TOKEN_CONFIG.name,
    symbol: TOKEN_CONFIG.symbol,
    description: TOKEN_CONFIG.description,
    image: '',
    attributes: [],
    properties: { files: [], category: 'image' },
  };

  console.log('📤 Uploading metadata...');
  const uri = await umi.uploader.uploadJson(metadata);
  console.log(`📄 URI: ${uri}`);

  console.log('\n🔨 Creating mint + metadata');
  await createFungible(umi, {
    mint: mintSigner,
    name: TOKEN_CONFIG.name,
    symbol: TOKEN_CONFIG.symbol,
    uri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: TOKEN_CONFIG.decimals,
  }).sendAndConfirm(umi);

  // Resolve Token-2022 program id registered by mplToolbox
  const TOKEN_2022 = umi.programs.get('splToken2022').publicKey;

  console.log('\n💳 Ensuring ATA for payer (Token-2022)');
  const ata = findAssociatedTokenPda(umi, {
    mint: mintSigner.publicKey,
    owner: wallet.publicKey,
    tokenProgramId: TOKEN_2022,
  });
  try {
    await createAssociatedToken(umi, {
      mint: mintSigner.publicKey,
      owner: wallet.publicKey,
      tokenProgram: TOKEN_2022,
    }).sendAndConfirm(umi);
    console.log(`✅ ATA: ${ata[0]}`);
  } catch {
    console.log('ℹ️ ATA may already exist');
  }

  console.log('\n🪙 Minting initial supply');
  const amount = BigInt(TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals));
  const mintTx = await mintTokensTo(umi, {
    mint: mintSigner.publicKey,
    token: ata[0],
    mintAuthority: wallet,
    amount,
  }).sendAndConfirm(umi);

  console.log(`🎉 Minted ${TOKEN_CONFIG.initialSupply.toLocaleString()} ${TOKEN_CONFIG.symbol}`);
  console.log(`🧾 Mint TX: ${mintTx.signature}`);

  const tokenInfo = {
    mintAddress: mintSigner.publicKey.toString(),
    tokenAccount: ata[0].toString(),
    name: TOKEN_CONFIG.name,
    symbol: TOKEN_CONFIG.symbol,
    decimals: TOKEN_CONFIG.decimals,
    initialSupply: TOKEN_CONFIG.initialSupply,
    metadataUri: uri,
    mintTransaction: mintTx.signature.toString(),
    createdAt: new Date().toISOString(),
    network: 'devnet',
  };
  fs.writeFileSync(path.join(process.cwd(), 'token-info.json'), JSON.stringify(tokenInfo, null, 2));
  console.log('\n📦 Saved token-info.json');

  console.log(`🔍 Explorer: https://explorer.solana.com/address/${mintSigner.publicKey}?cluster=devnet`);
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  });
}

export {};
