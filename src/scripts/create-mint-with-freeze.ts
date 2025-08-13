import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import {
  createMint as splCreateMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey, signerIdentity } from '@metaplex-foundation/umi';
import fs from 'fs';
import path from 'path';

const loadWeb3Wallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const main = async () => {
  console.log('🧊 Creating new SPL mint with freeze authority and migrating supply');

  const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
  if (!fs.existsSync(tokenInfoPath)) throw new Error('token-info.json not found');
  const oldInfo = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8')) as any;

  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const payer = loadWeb3Wallet();

  // Read old mint data to preserve decimals and migrate supply
  const oldMintPubkey = new PublicKey(oldInfo.mintAddress);
  const oldMint = await getMint(conn, oldMintPubkey);
  const decimals = oldInfo.decimals ?? oldMint.decimals;
  const supply = oldMint.supply; // bigint amount in base units
  console.log(`ℹ️ Old mint: ${oldInfo.mintAddress} | decimals=${decimals} | supply=${supply.toString()}`);

  // Create new mint with freeze authority
  console.log('🔨 Creating new mint with freeze authority');
  const newMint = await splCreateMint(conn, payer, payer.publicKey, payer.publicKey, decimals);
  console.log(`✅ New mint: ${newMint.toBase58()}`);

  // Create ATA for payer and mint the same supply
  console.log('💳 Ensuring ATA for payer on new mint');
  const newAta = await getOrCreateAssociatedTokenAccount(conn, payer, newMint, payer.publicKey);

  console.log('🪙 Migrating supply to new mint');
  if (supply > 0n) {
    await mintTo(conn, payer, newMint, newAta.address, payer.publicKey, Number(supply));
  }
  console.log('✅ Supply minted to new mint ATA');

  // Create metadata account for new mint using previous metadataUri if present
  const umi = createSolanaConnection();
  const umiWallet = loadKeypairFromFile(umi, 'wallet');
  umi.use(signerIdentity(umiWallet));

  const name = oldInfo.name || 'Vardiano';
  const symbol = oldInfo.symbol || 'VARD';

  let metadataUri = oldInfo.metadataUri as string | undefined;
  if (!metadataUri) {
    // build a minimal JSON if none exists
    const metadataJson = {
      name,
      symbol,
      description: oldInfo.description || 'Vardiano token on Solana',
      image: '',
      external_url: '',
      attributes: [],
      properties: { files: [], category: 'image' },
    };
    console.log('📤 Uploading default metadata JSON...');
    metadataUri = await umi.uploader.uploadJson(metadataJson);
    console.log(`✅ Uploaded. URI: ${metadataUri}`);
  }

  console.log('🧾 Creating metadata account (V3) for new mint');
  const { signature } = await createMetadataAccountV3(umi, {
    mint: publicKey(newMint.toBase58()),
    mintAuthority: umiWallet,
    payer: umiWallet,
    updateAuthority: umiWallet.publicKey,
    data: {
      name,
      symbol,
      uri: metadataUri!,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  }).sendAndConfirm(umi);
  console.log(`✅ Metadata created on new mint. TX: ${signature}`);

  // Persist: move old info to previousMints, set new as active
  const updated = {
    ...oldInfo,
    previousMints: [
      ...(oldInfo.previousMints || []),
      {
        mintAddress: oldInfo.mintAddress,
        tokenAccount: oldInfo.tokenAccount,
        metadataUri: oldInfo.metadataUri || null,
        createdAt: oldInfo.createdAt || null,
      },
    ],
    mintAddress: newMint.toBase58(),
    tokenAccount: newAta.address.toBase58(),
    decimals,
    metadataUri,
    migratedFrom: oldInfo.mintAddress,
    migratedAt: new Date().toISOString(),
  };
  fs.writeFileSync(tokenInfoPath, JSON.stringify(updated, null, 2));
  console.log('💾 Updated token-info.json to point to the new mint');

  console.log(`🔍 New Mint: https://explorer.solana.com/address/${newMint.toBase58()}?cluster=devnet`);
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Create mint with freeze failed:', e.message || e);
    process.exit(1);
  });
}

export {};
