import { 
  createFungible,
  mplTokenMetadata 
} from '@metaplex-foundation/mpl-token-metadata';
import { 
  findAssociatedTokenPda, 
  createAssociatedToken
} from '@metaplex-foundation/mpl-toolbox';
import { 
  generateSigner, 
  percentAmount, 
  signerIdentity
} from '@metaplex-foundation/umi';
import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import fs from 'fs';
import path from 'path';

// Load token configuration
let TOKEN_CONFIG = {
  name: 'Vardiano',
  symbol: 'VARD',
  description: 'A revolutionary Solana token built for the future of decentralized finance',
  decimals: 9,
  initialSupply: 1_000_000_000,
};

// Try to load configuration from file
try {
  const configPath = path.join(process.cwd(), 'token-config.json');
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    TOKEN_CONFIG = { ...TOKEN_CONFIG, ...configData };
    console.log('📄 Loaded token configuration from token-config.json');
  }
} catch (error) {
  console.log('ℹ️ Using default token configuration');
}

const createToken = async () => {
  console.log('🪙 Creating SPL Token on Solana...\n');
  
  try {
    const umi = createSolanaConnection();
    
    // Load wallet
    const wallet = loadKeypairFromFile(umi, 'wallet');
    umi.use(signerIdentity(wallet));
    
    console.log(`📤 Using wallet: ${wallet.publicKey}`);
    
    // Generate mint keypair
    const mintSigner = generateSigner(umi);
    console.log(`🏭 Mint address: ${mintSigner.publicKey}`);
    
    // Create metadata
    const metadata = {
      name: TOKEN_CONFIG.name,
      symbol: TOKEN_CONFIG.symbol,
      description: TOKEN_CONFIG.description,
      image: '',
      attributes: [],
      properties: {
        files: [],
        category: 'image'
      }
    };
    
    // Upload metadata JSON
    console.log('📤 Uploading metadata...');
    const metadataUri = await umi.uploader.uploadJson(metadata);
    console.log(`📄 Metadata uploaded: ${metadataUri}`);
    
    // Create the token with metadata
    console.log('\n🔨 Creating token mint and metadata...');
    
    const createTokenTx = await createFungible(umi, {
      mint: mintSigner,
      name: TOKEN_CONFIG.name,
      symbol: TOKEN_CONFIG.symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: percentAmount(0),
      decimals: TOKEN_CONFIG.decimals,
    }).sendAndConfirm(umi);
    
    console.log(`✅ Token created! Transaction: ${createTokenTx.signature}`);
    
    // Create associated token account
    console.log('\n💰 Creating token account...');
    
    const associatedTokenAccount = findAssociatedTokenPda(umi, {
      mint: mintSigner.publicKey,
      owner: wallet.publicKey,
    });
    
    try {
      await createAssociatedToken(umi, {
        mint: mintSigner.publicKey,
        owner: wallet.publicKey,
      }).sendAndConfirm(umi);
      
      console.log(`✅ Token account created: ${associatedTokenAccount[0]}`);
    } catch (tokenAccountError) {
      console.log('ℹ️ Token account may already exist, continuing...');
    }
    
    // Save token info
    const tokenInfo = {
      mintAddress: mintSigner.publicKey.toString(),
      tokenAccount: associatedTokenAccount[0].toString(),
      name: TOKEN_CONFIG.name,
      symbol: TOKEN_CONFIG.symbol,
      decimals: TOKEN_CONFIG.decimals,
      initialSupply: TOKEN_CONFIG.initialSupply,
      metadataUri,
      createTransaction: createTokenTx.signature.toString(),
      createdAt: new Date().toISOString(),
      network: 'devnet',
      note: 'Token created successfully! You can now mint tokens using the mint authority.'
    };
    
    const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
    fs.writeFileSync(tokenInfoPath, JSON.stringify(tokenInfo, null, 2));
    
    console.log('\n📊 Token Information:');
    console.log(`   Name: ${TOKEN_CONFIG.name}`);
    console.log(`   Symbol: ${TOKEN_CONFIG.symbol}`);
    console.log(`   Mint: ${mintSigner.publicKey}`);
    console.log(`   Token Account: ${associatedTokenAccount[0]}`);
    console.log(`   Decimals: ${TOKEN_CONFIG.decimals}`);
    console.log(`   Info saved to: ${tokenInfoPath}`);
    
    const explorerUrl = `https://explorer.solana.com/address/${mintSigner.publicKey}?cluster=devnet`;
    console.log(`\n🔍 View on Solana Explorer: ${explorerUrl}`);
    
    console.log('\n🎉 Token created successfully!');
    console.log('📝 Note: The token has been created with 0 initial supply.');
    console.log('💡 You can mint tokens later using the mint authority.');
    
    return {
      mintAddress: mintSigner.publicKey.toString(),
      tokenAccount: associatedTokenAccount[0].toString(),
      success: true
    };
    
  } catch (error) {
    console.error('❌ Error creating token:', error);
    
    if (error instanceof Error && error.message) {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createToken()
    .then((result) => {
      console.log('\n🚀 Token creation completed successfully!');
      console.log('Result:', result);
    })
    .catch((error) => {
      console.error('\n💥 Token creation failed:', error.message);
      process.exit(1);
    });
}

export default createToken; 