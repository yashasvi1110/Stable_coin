import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import { createMint as splCreateMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const loadWallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const createFreezeAuthority = (): Keypair => {
  console.log('🔑 Creating new freeze authority...');
  const freezeAuthority = Keypair.generate();
  
  // Save the freeze authority
  const keypairPath = path.join(process.cwd(), 'keypairs', 'freeze-authority.json');
  fs.writeFileSync(keypairPath, JSON.stringify(Array.from(freezeAuthority.secretKey)));
  
  console.log(`✅ Freeze authority created: ${freezeAuthority.publicKey.toBase58()}`);
  return freezeAuthority;
};

const loadFreezeAuthority = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'freeze-authority.json');
  if (!fs.existsSync(p)) {
    return createFreezeAuthority();
  }
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const main = async () => {
  const infoPath = path.join(process.cwd(), 'token-info.json');
  const cfgPath = path.join(process.cwd(), 'token-config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));

  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const wallet = loadWallet();
  const freezeAuthority = loadFreezeAuthority();

  console.log('🧊 Creating freezable SPL mint');
  console.log(`👤 Mint authority: ${wallet.publicKey.toBase58()}`);
  console.log(`🧑‍⚖️ Freeze authority: ${freezeAuthority.publicKey.toBase58()}`);

  const mint = await splCreateMint(conn, wallet, wallet.publicKey, freezeAuthority.publicKey, cfg.decimals ?? 9);
  const ata = await getOrCreateAssociatedTokenAccount(conn, wallet, mint, wallet.publicKey);

  const initial = Number(BigInt(cfg.initialSupply ?? 0) * 10n ** BigInt(cfg.decimals ?? 9));
  if (initial > 0) {
    await mintTo(conn, wallet, mint, ata.address, wallet.publicKey, initial);
    console.log(`✅ Minted initial ${cfg.initialSupply} ${cfg.symbol}`);
  }

  const newInfo = {
    mintAddress: mint.toBase58(),
    tokenAccount: ata.address.toBase58(),
    name: cfg.name,
    symbol: cfg.symbol,
    decimals: cfg.decimals ?? 9,
    initialSupply: cfg.initialSupply ?? 0,
    createdAt: new Date().toISOString(),
    network: 'devnet',
    freezeAuthority: freezeAuthority.publicKey.toBase58(),
  };
  fs.writeFileSync(infoPath, JSON.stringify(newInfo, null, 2));
  console.log('💾 Wrote token-info.json');
  console.log(`🔍 Mint: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Failed:', e?.message || e);
    process.exit(1);
  });
}

export {};


