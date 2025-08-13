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
  const [newAuthorityArg] = process.argv.slice(2);
  if (!newAuthorityArg) {
    console.log('Usage: ts-node src/scripts/authority-spl.ts <new-authority-base58 | null>');
    process.exit(1);
  }

  const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
  if (!fs.existsSync(tokenInfoPath)) throw new Error('token-info.json not found');
  const info = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8')) as { mintAddress: string };

  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const wallet = loadWallet();
  const mintPubkey = new PublicKey(info.mintAddress);

  const newAuthority = newAuthorityArg === 'null' ? null : new PublicKey(newAuthorityArg);

  console.log(`🔄 Setting mint authority of ${info.mintAddress} -> ${newAuthority ? newAuthority.toBase58() : 'null'}`);
  const sig = await setAuthority(
    conn,
    wallet,
    mintPubkey,
    wallet.publicKey,
    AuthorityType.MintTokens,
    newAuthority
  );

  console.log(`✅ Authority updated. TX: ${sig}`);
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Authority transfer failed:', e.message || e);
    process.exit(1);
  });
}

export {};
