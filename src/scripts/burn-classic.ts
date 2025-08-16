import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, burn } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const loadWallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const main = async () => {
  const args = process.argv.slice(2);
  const amount = args[0] ? parseInt(args[0], 10) : undefined;
  if (!amount) {
    console.log('Usage: npm run burn-classic <amount>');
    process.exit(0);
  }

  const infoPath = path.join(process.cwd(), 'token-info.json');
  if (!fs.existsSync(infoPath)) throw new Error('token-info.json not found');
  const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));

  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const wallet = loadWallet();

  const mint = new PublicKey(info.mintAddress);
  const ata = await getOrCreateAssociatedTokenAccount(conn, wallet, mint, wallet.publicKey);

  const raw = Number(BigInt(amount) * 10n ** BigInt(info.decimals));
  const sig = await burn(conn, wallet, ata.address, mint, wallet.publicKey, raw);

  console.log(`✅ Burned ${amount.toLocaleString()} ${info.symbol}`);
  console.log(`🧾 TX: ${sig}`);

  info.burnTransactions = info.burnTransactions || [];
  info.burnTransactions.push({ amount, transaction: sig, timestamp: new Date().toISOString() });
  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Burn failed:', e?.message || e);
    process.exit(1);
  });
}

export {};


