import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import { findAssociatedTokenPda, createAssociatedToken } from '@metaplex-foundation/mpl-toolbox';
import { generateSigner } from '@metaplex-foundation/umi';
import fs from 'fs';
import path from 'path';

const main = async () => {
  console.log('💸 Quick transfer test');
  const umi = createSolanaConnection();
  const wallet = loadKeypairFromFile(umi, 'wallet');
  console.log(`📤 Sender: ${wallet.publicKey}`);

  const infoPath = path.join(process.cwd(), 'token-info.json');
  if (!fs.existsSync(infoPath)) throw new Error('token-info.json not found');
  const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));

  // Generate a temp recipient keypair (devnet)
  const recipient = generateSigner(umi);
  console.log(`📥 Recipient: ${recipient.publicKey}`);

  const ataSender = findAssociatedTokenPda(umi, { mint: info.mintAddress, owner: wallet.publicKey });
  const ataRecipient = findAssociatedTokenPda(umi, { mint: info.mintAddress, owner: recipient.publicKey });

  // Ensure recipient ATA
  try {
    await createAssociatedToken(umi, { mint: info.mintAddress, owner: recipient.publicKey }).sendAndConfirm(umi);
    console.log(`✅ Recipient ATA: ${ataRecipient[0]}`);
  } catch {
    console.log('ℹ️ Recipient ATA may already exist');
  }

  // Build raw transfer via SPL program using Umi transaction builder API
  const amount = BigInt(1000 * Math.pow(10, info.decimals - 0)); // 1000 units (adjust if needed)

  // Umi SPL transfer builder requires program helper; to keep concise, leave as a placeholder to wire once
  console.log('⚠️ Transfer builder wiring is pending in this minimal script.');
  console.log('   We will execute the transfer right after minting confirmation.');
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Quick transfer failed:', e);
    process.exit(1);
  });
}

export {};
