import { Connection, clusterApiUrl, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  createMint as splCreateMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer as splTransfer,
} from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const loadWallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const DECIMALS = 9;

const main = async () => {
  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const wallet = loadWallet();
  console.log(`👤 Payer: ${wallet.publicKey.toBase58()}`);

  // 1) Create mint with wallet as mint authority
  console.log('🔨 Creating SPL mint');
  const mint = await splCreateMint(conn, wallet, wallet.publicKey, null, DECIMALS);
  console.log(`✅ Mint: ${mint.toBase58()}`);

  // 2) Ensure wallet ATA
  console.log('💳 Ensuring ATA');
  const ata = await getOrCreateAssociatedTokenAccount(conn, wallet, mint, wallet.publicKey);
  console.log(`✅ ATA: ${ata.address.toBase58()}`);

  // 3) Mint initial supply (100000 tokens)
  const initial = 100000n * 10n ** BigInt(DECIMALS);
  console.log('🪙 Minting supply');
  await mintTo(conn, wallet, mint, ata.address, wallet.publicKey, Number(initial));
  console.log('🎉 Minted 100,000 tokens');

  // 4) Transfer test 1,000 tokens to a temp recipient
  const recipient = Keypair.generate();
  const ataRecipient = await getOrCreateAssociatedTokenAccount(conn, wallet, mint, recipient.publicKey);
  const toSend = 1000n * 10n ** BigInt(DECIMALS);
  const sig = await splTransfer(conn, wallet, ata.address, ataRecipient.address, wallet.publicKey, Number(toSend));
  console.log(`✅ Transferred 1,000 tokens. TX: ${sig}`);

  // Save brief info
  const tokenInfo = {
    mintAddress: mint.toBase58(),
    tokenAccount: ata.address.toBase58(),
    testTransferTx: sig,
    network: 'devnet',
  };
  fs.writeFileSync(path.join(process.cwd(), 'token-info.json'), JSON.stringify(tokenInfo, null, 2));

  console.log(`🔍 Mint: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
  console.log(`🔍 Transfer TX: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ SPL mint flow failed:', e);
    process.exit(1);
  });
}

export {};
