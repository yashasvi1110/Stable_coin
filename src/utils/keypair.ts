import { generateSigner, createSignerFromKeypair } from '@metaplex-foundation/umi';
import { Umi } from '@metaplex-foundation/umi';
import fs from 'fs';
import path from 'path';

export const generateNewKeypair = (umi: Umi) => {
  const keypair = generateSigner(umi);
  return keypair;
};

export const saveKeypairToFile = (keypair: any, filename: string) => {
  const keypairDir = path.join(process.cwd(), 'keypairs');
  if (!fs.existsSync(keypairDir)) {
    fs.mkdirSync(keypairDir, { recursive: true });
  }
  
  const filepath = path.join(keypairDir, `${filename}.json`);
  fs.writeFileSync(filepath, JSON.stringify(Array.from(keypair.secretKey)));
  
  console.log(`💾 Keypair saved to: ${filepath}`);
  console.log(`🔑 Public Key: ${keypair.publicKey}`);
  
  return filepath;
};

export const loadKeypairFromFile = (umi: Umi, filename: string) => {
  try {
    const filepath = path.join(process.cwd(), 'keypairs', `${filename}.json`);
    const secretKeyArray = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    const secretKey = new Uint8Array(secretKeyArray);
    
    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    return createSignerFromKeypair(umi, keypair);
  } catch (error) {
    throw new Error(`Failed to load keypair from ${filename}: ${error}`);
  }
};
