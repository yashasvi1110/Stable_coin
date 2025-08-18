import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface MainnetConfig {
  rpcUrl: string;
  network: 'mainnet-beta';
  tokenName: string;
  tokenSymbol: string;
  description: string;
  decimals: number;
  initialSupply: number;
  logoUrl: string;
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
  marketingBudget: number;
  liquidityTarget: number;
  launchDate: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const main = async () => {
  console.log('⚙️  Mainnet Configuration Setup\n');
  console.log('This will configure your token for mainnet deployment.\n');
  
  try {
    const config: MainnetConfig = {
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      network: 'mainnet-beta',
      tokenName: '',
      tokenSymbol: '',
      description: '',
      decimals: 9,
      initialSupply: 0,
      logoUrl: '',
      website: '',
      twitter: '',
      telegram: '',
      discord: '',
      marketingBudget: 0,
      liquidityTarget: 0,
      launchDate: ''
    };
    
    // Token Details
    config.tokenName = await question('Token Name (e.g., Vardiano): ');
    config.tokenSymbol = await question('Token Symbol (3-5 characters, e.g., VARD): ');
    config.description = await question('Token Description: ');
    
    const decimalsInput = await question('Decimals (default 9): ');
    config.decimals = decimalsInput ? parseInt(decimalsInput) : 9;
    
    const supplyInput = await question('Initial Supply (e.g., 1000000): ');
    config.initialSupply = parseInt(supplyInput) || 1000000;
    
    // Marketing & Social
    config.logoUrl = await question('Logo URL (IPFS/Arweave): ');
    config.website = await question('Website URL: ');
    config.twitter = await question('Twitter Handle (without @): ');
    config.telegram = await question('Telegram Group: ');
    config.discord = await question('Discord Server: ');
    
    // Business Details
    const budgetInput = await question('Marketing Budget (SOL): ');
    config.marketingBudget = parseFloat(budgetInput) || 0;
    
    const liquidityInput = await question('Liquidity Target (SOL): ');
    config.liquidityTarget = parseFloat(liquidityInput) || 10;
    
    config.launchDate = await question('Launch Date (YYYY-MM-DD): ');
    
    // Validate inputs
    if (!config.tokenName || !config.tokenSymbol) {
      throw new Error('Token name and symbol are required');
    }
    
    if (config.tokenSymbol.length < 3 || config.tokenSymbol.length > 5) {
      throw new Error('Token symbol must be 3-5 characters');
    }
    
    if (config.initialSupply <= 0) {
      throw new Error('Initial supply must be greater than 0');
    }
    
    // Save configuration
    const configPath = path.join(process.cwd(), 'mainnet-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log('\n✅ Mainnet configuration saved!');
    console.log(`📄 Config file: ${configPath}`);
    
    // Display summary
    console.log('\n📊 Configuration Summary:');
    console.log(`   Token: ${config.tokenName} (${config.tokenSymbol})`);
    console.log(`   Supply: ${config.initialSupply.toLocaleString()}`);
    console.log(`   Decimals: ${config.decimals}`);
    console.log(`   Network: ${config.network}`);
    console.log(`   Logo: ${config.logoUrl}`);
    console.log(`   Website: ${config.website}`);
    console.log(`   Social: @${config.twitter}, ${config.telegram}, ${config.discord}`);
    console.log(`   Marketing Budget: ${config.marketingBudget} SOL`);
    console.log(`   Liquidity Target: ${config.liquidityTarget} SOL`);
    console.log(`   Launch Date: ${config.launchDate}`);
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Create mainnet wallet: npm run create-mainnet-wallet');
    console.log('   2. Fund mainnet wallet with SOL');
    console.log('   3. Deploy to mainnet: npm run deploy-mainnet');
    
    rl.close();
    
  } catch (error) {
    console.error('❌ Configuration failed:', error);
    rl.close();
    process.exit(1);
  }
};

if (require.main === module) {
  main().catch((e) => {
    console.error('❌ Failed:', e?.message || e);
    process.exit(1);
  });
}

export {}; 