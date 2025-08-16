import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import { setAuthority, AuthorityType } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const loadWallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const main = async () => {
  const args = process.argv.slice(2);
  const newAuth = args[0];
  if (!newAuth) {
    console.log('Usage: npm run transfer-authority-classic <new-authority-pubkey>');
    process.exit(0);
  }

  const infoPath = path.join(process.cwd(), 'token-info.json');
  if (!fs.existsSync(infoPath)) throw new Error('token-info.json not found');
  const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));

  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const wallet = loadWallet();

  const sig = await setAuthority(
    conn,
    wallet,
    new PublicKey(info.mintAddress),
    wallet.publicKey,
    AuthorityType.MintTokens,
    new PublicKey(newAuth)
  );

  console.log('✅ Mint authority transferred');
  console.log(`🧾 TX: ${sig}`);

  info.mintAuthority = newAuth;
  info.authorityTransferTransaction = sig;
  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Transfer authority failed:', e?.message || e);
    process.exit(1);
  });
}

export {};


