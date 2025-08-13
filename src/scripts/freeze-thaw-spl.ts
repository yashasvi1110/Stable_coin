import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import { getMint, getOrCreateAssociatedTokenAccount, freezeAccount, thawAccount } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const loadWallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const main = async () => {
  const [action, ownerAddr] = process.argv.slice(2);
  if (!action || !['freeze', 'unfreeze'].includes(action) || !ownerAddr) {
    console.log('Usage: ts-node src/scripts/freeze-thaw-spl.ts <freeze|unfreeze> <owner-wallet-address>');
    process.exit(1);
  }

  const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
  if (!fs.existsSync(tokenInfoPath)) throw new Error('token-info.json not found. Create a token first.');
  const info = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8')) as { mintAddress: string; symbol?: string };

  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const payer = loadWallet();
  const mintPubkey = new PublicKey(info.mintAddress);
  const owner = new PublicKey(ownerAddr);

  // Preflight: check mint freeze authority
  const mint = await getMint(conn, mintPubkey);
  if (!mint.freezeAuthority) {
    console.error('❌ This mint has no freeze authority set. Freeze/unfreeze is not possible for this token.');
    process.exit(1);
  }
  if (!mint.freezeAuthority.equals(payer.publicKey)) {
    console.error(`❌ Freeze authority mismatch. Required: ${mint.freezeAuthority.toBase58()}, You: ${payer.publicKey.toBase58()}`);
    process.exit(1);
  }

  // Ensure owner's ATA exists
  const ata = await getOrCreateAssociatedTokenAccount(conn, payer, mintPubkey, owner);

  if (action === 'freeze') {
    console.log(`❄️ Freezing account ${ata.address.toBase58()} for owner ${owner.toBase58()}`);
    const sig = await freezeAccount(conn, payer, ata.address, mintPubkey, payer.publicKey);
    console.log(`✅ Frozen. TX: ${sig}`);
  } else {
    console.log(`🌡️ Unfreezing account ${ata.address.toBase58()} for owner ${owner.toBase58()}`);
    const sig = await thawAccount(conn, payer, ata.address, mintPubkey, payer.publicKey);
    console.log(`✅ Unfrozen. TX: ${sig}`);
  }
};

if (require.main === module) {
  main().catch((e) => {
    console.error('💥 Freeze/Unfreeze failed:', e.message || e);
    process.exit(1);
  });
}

export {};
