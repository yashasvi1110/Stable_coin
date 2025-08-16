import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';

const airdrop = async (amountSol: number = 2, keypairName: string = 'wallet') => {
  console.log('🚰 Requesting devnet airdrop\n');

  const umi = createSolanaConnection();
  const wallet = loadKeypairFromFile(umi, keypairName);

  const endpoint = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
  const connection = new Connection(endpoint, 'confirmed');

  console.log(`🔑 Wallet: ${wallet.publicKey}`);
  console.log(`💧 Amount: ${amountSol} SOL`);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const sig = await connection.requestAirdrop(new PublicKey(wallet.publicKey), Math.floor(amountSol * LAMPORTS_PER_SOL));
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

  console.log(`✅ Airdrop tx: ${sig}`);
};

if (require.main === module) {
  const amountArg = process.argv[2];
  const fileArg = process.argv[3];
  const amount = amountArg ? parseFloat(amountArg) : 2;
  const keypairName = fileArg || 'wallet';
  airdrop(amount, keypairName).catch((e) => {
    console.error('❌ Airdrop failed:', e?.message || e);
    process.exit(1);
  });
}

export default airdrop;


