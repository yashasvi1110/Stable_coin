import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import {
  createMint as splCreateMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer as splTransfer,
} from '@solana/spl-token';
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

const loadWallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const main = async () => {
  console.log('🪙 Creating mint, minting supply, and testing transfer (classic SPL)...\n');
  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const wallet = loadWallet();
  console.log(`📤 Payer/Mint Authority: ${wallet.publicKey.toBase58()}`);

  console.log('\n🔨 Creating mint');
  const mint = await splCreateMint(conn, wallet, wallet.publicKey, null, TOKEN_CONFIG.decimals);
  console.log(`✅ Mint: ${mint.toBase58()}`);

  console.log('\n💳 Ensuring ATA for payer');
  const ataSender = await getOrCreateAssociatedTokenAccount(conn, wallet, mint, wallet.publicKey);
  console.log(`✅ Sender ATA: ${ataSender.address.toBase58()}`);

  console.log('\n🪙 Minting initial supply');
  const amount = Number(BigInt(TOKEN_CONFIG.initialSupply) * 10n ** BigInt(TOKEN_CONFIG.decimals));
  await mintTo(conn, wallet, mint, ataSender.address, wallet.publicKey, amount);
  console.log(`🎉 Minted ${TOKEN_CONFIG.initialSupply.toLocaleString()} ${TOKEN_CONFIG.symbol}`);

  console.log('\n🚚 Transfer test (1,000 tokens)');
  const recipient = Keypair.generate();
  const ataRecipient = await getOrCreateAssociatedTokenAccount(conn, wallet, mint, recipient.publicKey);
  const transferAmount = Number(1000n * 10n ** BigInt(TOKEN_CONFIG.decimals));
  const transferSig = await splTransfer(conn, wallet, ataSender.address, ataRecipient.address, wallet.publicKey, transferAmount);
  console.log(`✅ Transferred 1,000 ${TOKEN_CONFIG.symbol}`);
  console.log(`🧾 Transfer TX: ${transferSig}`);

  const tokenInfo = {
    mintAddress: mint.toBase58(),
    tokenAccount: ataSender.address.toBase58(),
    name: TOKEN_CONFIG.name,
    symbol: TOKEN_CONFIG.symbol,
    decimals: TOKEN_CONFIG.decimals,
    initialSupply: TOKEN_CONFIG.initialSupply,
    createdAt: new Date().toISOString(),
    network: 'devnet',
    testTransferTx: transferSig,
  };
  fs.writeFileSync(path.join(process.cwd(), 'token-info.json'), JSON.stringify(tokenInfo, null, 2));
  console.log('\n📦 Saved token-info.json');

  console.log(`🔍 Mint: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
  console.log(`🔍 Transfer TX: https://explorer.solana.com/tx/${transferSig}?cluster=devnet`);
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  });
}

export {};
