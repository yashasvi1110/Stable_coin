import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import { createMint as splCreateMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const loadWallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const main = async () => {
  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const wallet = loadWallet();
  const initialSupplyCli = Number(process.argv[2] || '10000');
  const decimalsCli = Number(process.argv[3] || '9');

  console.log(`🔨 Creating freezable mint (decimals=${decimalsCli}) and minting ${initialSupplyCli} tokens`);

  const mint = await splCreateMint(conn, wallet, wallet.publicKey, wallet.publicKey, decimalsCli);
  const ata = await getOrCreateAssociatedTokenAccount(conn, wallet, mint, wallet.publicKey);
  const amount = Number(BigInt(initialSupplyCli) * 10n ** BigInt(decimalsCli));
  await mintTo(conn, wallet, mint, ata.address, wallet.publicKey, amount);

  const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
  const prev = fs.existsSync(tokenInfoPath) ? JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8')) : null;

  const updated = {
    ...(prev || {}),
    previousMints: [
      ...((prev && prev.previousMints) || []),
      ...(prev
        ? [
            {
              mintAddress: prev.mintAddress,
              tokenAccount: prev.tokenAccount,
              metadataUri: prev.metadataUri || null,
              createdAt: prev.createdAt || null,
            },
          ]
        : []),
    ],
    mintAddress: mint.toBase58(),
    tokenAccount: ata.address.toBase58(),
    name: (prev && prev.name) || 'Vardiano',
    symbol: (prev && prev.symbol) || 'VARD',
    description: (prev && prev.description) || 'Vardiano token',
    decimals: decimalsCli,
    initialSupply: initialSupplyCli,
    createdAt: new Date().toISOString(),
    network: 'devnet',
  };

  fs.writeFileSync(tokenInfoPath, JSON.stringify(updated, null, 2));

  console.log(`✅ New freezable mint: ${mint.toBase58()}`);
  console.log(`   ATA: ${ata.address.toBase58()}`);
  console.log(`🔍 Explorer: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Create freezable mint failed:', e.message || e);
    process.exit(1);
  });
}

export {};
