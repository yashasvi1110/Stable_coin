import { Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, burn, mintTo } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const loadWallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const loadTokenInfo = () => {
  const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
  if (!fs.existsSync(tokenInfoPath)) throw new Error('token-info.json not found. Create a token first.');
  return JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8')) as {
    mintAddress: string;
    tokenAccount: string;
    decimals: number;
    symbol: string;
  };
};

const main = async () => {
  const [cmd, amountArg] = process.argv.slice(2);
  if (!cmd || !['burn', 'mint-additional'].includes(cmd)) {
    console.log('Usage: ts-node src/scripts/token-manage-spl.ts <burn|mint-additional> <amount>');
    process.exit(1);
  }
  const amount = Number(amountArg || '0');
  if (!amount || amount <= 0) throw new Error('Provide a positive <amount>');

  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const wallet = loadWallet();
  const info = loadTokenInfo();

  const mintPubkey = new (await import('@solana/web3.js')).PublicKey(info.mintAddress);

  const ata = await getOrCreateAssociatedTokenAccount(conn, wallet, mintPubkey, wallet.publicKey);
  const rawAmount = Number(BigInt(amount) * 10n ** BigInt(info.decimals));

  if (cmd === 'burn') {
    console.log(`🔥 Burning ${amount} ${info.symbol} ...`);
    const sig = await burn(conn, wallet, ata.address, mintPubkey, wallet.publicKey, rawAmount);
    console.log(`✅ Burned. TX: ${sig}`);
  } else if (cmd === 'mint-additional') {
    console.log(`🪙 Minting additional ${amount} ${info.symbol} ...`);
    const sig = await mintTo(conn, wallet, mintPubkey, ata.address, wallet.publicKey, rawAmount);
    console.log(`✅ Minted. TX: ${sig}`);
  }
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Management failed:', e.message || e);
    process.exit(1);
  });
}

export {};
