import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const main = async () => {
  const kp = Keypair.generate();
  const dir = path.join(process.cwd(), 'keypairs');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'freeze-authority.json');
  fs.writeFileSync(file, JSON.stringify(Array.from(kp.secretKey)));
  console.log('✅ Freeze authority created');
  console.log(`🔑 Public Key: ${kp.publicKey.toBase58()}`);
  console.log(`💾 Saved: ${file}`);
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Failed:', e?.message || e);
    process.exit(1);
  });
}

export {};


