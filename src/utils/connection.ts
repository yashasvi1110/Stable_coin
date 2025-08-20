import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox';
import { keypairIdentity } from '@metaplex-foundation/umi';
import { loadKeypairFromFile } from './keypair';
import dotenv from 'dotenv';

dotenv.config();

export const createSolanaConnection = () => {
  const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  
  const umi = createUmi(RPC_ENDPOINT)
    .use(mplTokenMetadata())
    .use(mplToolbox())
    .use(irysUploader({
      address: 'https://devnet.irys.xyz'
    }));

  // Load wallet keypair and set as signer
  try {
    const wallet = loadKeypairFromFile(umi, 'wallet');
    umi.use(keypairIdentity(wallet));
  } catch (error) {
    console.log('⚠️  No wallet keypair found, using default connection');
  }

  console.log('🔗 Connected to Solana Devnet');
  return umi;
};
