import { 
  updateMetadata,
  mplTokenMetadata 
} from '@metaplex-foundation/mpl-token-metadata';
import { createSolanaConnection } from '../utils/connection';
import { loadKeypairFromFile } from '../utils/keypair';
import fs from 'fs';
import path from 'path';

interface MetadataUpdate {
  description?: string;
  image?: string;
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  properties?: {
    files?: Array<{ type: string; uri: string }>;
    category?: string;
  };
}

const updateTokenMetadata = async (updates: MetadataUpdate) => {
  console.log('🔄 Updating Token Metadata\n');
  
  try {
    // Load token info
    const tokenInfoPath = path.join(process.cwd(), 'token-info.json');
    if (!fs.existsSync(tokenInfoPath)) {
      throw new Error('Token info not found. Please create a token first.');
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'));
    console.log(`📄 Token: ${tokenInfo.name} (${tokenInfo.symbol})`);
    console.log(`🏭 Mint: ${tokenInfo.mintAddress}`);
    
    const umi = createSolanaConnection();
    const wallet = loadKeypairFromFile(umi, 'wallet');
    
    console.log(`👤 Wallet: ${wallet.publicKey}`);
    
    // Create new metadata
    const newMetadata = {
      name: tokenInfo.name, // Cannot change
      symbol: tokenInfo.symbol, // Cannot change
      description: updates.description || 'A revolutionary Solana token built for the future of decentralized finance',
      image: updates.image || '',
      external_url: updates.externalUrl || '',
      attributes: updates.attributes || [],
      properties: updates.properties || {
        files: [],
        category: 'image'
      }
    };
    
    console.log('\n📤 Uploading updated metadata...');
    const newMetadataUri = await umi.uploader.uploadJson(newMetadata);
    console.log(`📄 New metadata uploaded: ${newMetadataUri}`);
    
    // Update the metadata on-chain
    console.log('\n🔄 Updating on-chain metadata...');
    
    const updateTx = await updateMetadata(umi, {
      mint: tokenInfo.mintAddress,
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      uri: newMetadataUri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    }).sendAndConfirm(umi);
    
    console.log(`✅ Metadata updated! Transaction: ${updateTx.signature}`);
    
    // Update token info file
    tokenInfo.metadataUri = newMetadataUri;
    tokenInfo.metadataUpdateTransaction = updateTx.signature.toString();
    tokenInfo.lastMetadataUpdate = new Date().toISOString();
    tokenInfo.metadata = newMetadata;
    
    fs.writeFileSync(tokenInfoPath, JSON.stringify(tokenInfo, null, 2));
    
    console.log('\n📊 Updated Metadata:');
    console.log(`   Description: ${newMetadata.description}`);
    if (newMetadata.image) console.log(`   Image: ${newMetadata.image}`);
    if (newMetadata.external_url) console.log(`   Website: ${newMetadata.external_url}`);
    console.log(`   Metadata URI: ${newMetadataUri}`);
    console.log(`   Transaction: ${updateTx.signature}`);
    
    const explorerUrl = `https://explorer.solana.com/address/${tokenInfo.mintAddress}?cluster=devnet`;
    console.log(`\n🔍 View updated token: ${explorerUrl}`);
    
    return {
      success: true,
      newMetadataUri,
      transaction: updateTx.signature.toString()
    };
    
  } catch (error) {
    console.error('❌ Error updating metadata:', error);
    throw error;
  }
};

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log('🔄 Token Metadata Update Tool\n');
    console.log('Usage:');
    console.log('  npm run update-description "New description"');
    console.log('  npm run update-image "https://example.com/image.png"');
    console.log('  npm run update-website "https://example.com"');
    console.log('  npm run update-all');
    return;
  }
  
  let updates: MetadataUpdate = {};
  
  switch (command) {
    case 'description':
      updates.description = args[1] || 'Updated description for Vardiano token';
      break;
    case 'image':
      updates.image = args[1] || 'https://example.com/token-image.png';
      break;
    case 'website':
      updates.externalUrl = args[1] || 'https://vardiano.com';
      break;
    case 'all':
      updates = {
        description: 'Vardiano - The future of decentralized finance on Solana',
        image: 'https://example.com/vardiano-logo.png',
        externalUrl: 'https://vardiano.com',
        attributes: [
          { trait_type: 'Network', value: 'Solana' },
          { trait_type: 'Type', value: 'Utility Token' },
          { trait_type: 'Version', value: '1.0' }
        ],
        properties: {
          files: [
            { type: 'image/png', uri: 'https://example.com/vardiano-logo.png' }
          ],
          category: 'image'
        }
      };
      break;
    default:
      console.error('❌ Unknown command:', command);
      return;
  }
  
  await updateTokenMetadata(updates);
  console.log('\n🎉 Metadata update completed successfully!');
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Metadata update failed:', error.message);
    process.exit(1);
  });
}

export default updateTokenMetadata; 