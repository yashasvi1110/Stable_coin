import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, freezeAccount, thawAccount } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const loadWallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'freeze-authority.json');
  if (!fs.existsSync(p)) throw new Error('freeze-authority.json not found. Run npm run create-authority');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const main = async () => {
  const args = process.argv.slice(2);
  const op = args[0];
  if (!op || (op !== 'freeze' && op !== 'unfreeze')) {
    console.log('Usage: npm run freeze-classic | npm run unfreeze-classic');
    process.exit(0);
  }

  const infoPath = path.join(process.cwd(), 'token-info.json');
  if (!fs.existsSync(infoPath)) throw new Error('token-info.json not found');
  const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));

  if (!info.freezeAuthority) throw new Error('This mint has no freezeAuthority. Create a freezable mint first.');

  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const freezeAuth = loadWallet();

  const mint = new PublicKey(info.mintAddress);
  const owner = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'keypairs', 'wallet.json'), 'utf-8'))));
  const ata = await getOrCreateAssociatedTokenAccount(conn, owner, mint, owner.publicKey);

  if (op === 'freeze') {
    const sig = await freezeAccount(conn, freezeAuth, ata.address, mint, freezeAuth.publicKey);
    console.log('✅ Account frozen');
    console.log(`🧾 TX: ${sig}`);
    info.frozen = true;
    info.freezeTransaction = sig;
  } else {
    const sig = await thawAccount(conn, freezeAuth, ata.address, mint, freezeAuth.publicKey);
    console.log('✅ Account unfrozen');
    console.log(`🧾 TX: ${sig}`);
    info.frozen = false;
    info.thawTransaction = sig;
  }

  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Failed:', e?.message || e);
    process.exit(1);
  });
}

export {};


