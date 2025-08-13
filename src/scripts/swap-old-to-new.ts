import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, burn, mintTo } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const loadWallet = (): Keypair => {
  const p = path.join(process.cwd(), 'keypairs', 'wallet.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
  return Keypair.fromSecretKey(secret);
};

const main = async () => {
  const amountCli = process.argv[2]; // optional human units

  const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
  if (!fs.existsSync(tokenInfoPath)) throw new Error('token-info.json not found');
  const info = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8')) as any;

  const prevMints = (info.previousMints || []) as Array<{ mintAddress: string; tokenAccount?: string }>;
  if (prevMints.length === 0) {
    console.log('ℹ️ No previous mint found. Nothing to swap.');
    return;
  }

  const oldMintAddress = prevMints[prevMints.length - 1].mintAddress;
  const newMintAddress = info.mintAddress as string;
  const decimals = info.decimals ?? 9;

  const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
  const wallet = loadWallet();

  const oldMint = new PublicKey(oldMintAddress);
  const newMint = new PublicKey(newMintAddress);

  const ataOld = await getOrCreateAssociatedTokenAccount(conn, wallet, oldMint, wallet.publicKey);
  const ataNew = await getOrCreateAssociatedTokenAccount(conn, wallet, newMint, wallet.publicKey);

  const balanceBaseUnits = BigInt(ataOld.amount.toString());
  if (balanceBaseUnits === 0n && !amountCli) {
    console.log('ℹ️ Old mint balance is zero. Nothing to swap.');
    return;
  }

  let amountToSwapBaseUnits: bigint;
  if (amountCli) {
    const human = BigInt(Math.floor(Number(amountCli)));
    amountToSwapBaseUnits = human * 10n ** BigInt(decimals);
    if (amountToSwapBaseUnits > balanceBaseUnits) {
      throw new Error('Requested amount exceeds old mint balance');
    }
  } else {
    amountToSwapBaseUnits = balanceBaseUnits;
  }

  const humanToSwap = Number(amountToSwapBaseUnits / (10n ** BigInt(decimals)));
  console.log(`🔄 Swapping ${humanToSwap} tokens from old mint -> new mint`);

  // 1) Burn from old mint (requires owner authority, which we have for our wallet's ATA)
  const burnSig = await burn(
    conn,
    wallet,
    ataOld.address,
    oldMint,
    wallet.publicKey,
    Number(amountToSwapBaseUnits)
  );
  console.log(`🔥 Burned old tokens. TX: ${burnSig}`);

  // 2) Mint to new mint (requires mint authority, which should be our wallet on new mint)
  const mintSig = await mintTo(
    conn,
    wallet,
    newMint,
    ataNew.address,
    wallet.publicKey,
    Number(amountToSwapBaseUnits)
  );
  console.log(`🪙 Minted new tokens. TX: ${mintSig}`);

  // Record swap
  info.swaps = info.swaps || [];
  info.swaps.push({
    from: oldMintAddress,
    to: newMintAddress,
    amount: humanToSwap,
    burnTx: burnSig,
    mintTx: mintSig,
    at: new Date().toISOString(),
  });
  fs.writeFileSync(tokenInfoPath, JSON.stringify(info, null, 2));
  console.log('💾 Recorded swap in token-info.json');

  console.log(`🔍 Burn TX: https://explorer.solana.com/tx/${burnSig}?cluster=devnet`);
  console.log(`🔍 Mint TX: https://explorer.solana.com/tx/${mintSig}?cluster=devnet`);
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Swap failed:', e.message || e);
    process.exit(1);
  });
}

export {};
