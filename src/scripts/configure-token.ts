import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface TokenConfig {
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  initialSupply: number;
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

const configureToken = async () => {
  console.log('🪙 Solana Token Configuration\n');
  console.log('Let\'s configure your token settings:\n');

  try {
    const name = await question('Token Name (e.g., "MyCoin"): ');
    const symbol = await question('Token Symbol (3-4 characters, e.g., "MYC"): ');
    const description = await question('Token Description: ');
    const decimalsInput = await question('Decimals (default: 9): ');
    const supplyInput = await question('Initial Supply (e.g., 1000000000 for 1 billion): ');

    const decimals = decimalsInput ? parseInt(decimalsInput) : 9;
    const initialSupply = supplyInput ? parseInt(supplyInput) : 1_000_000_000;

    const config: TokenConfig = {
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      description: description.trim(),
      decimals,
      initialSupply
    };

    // Validate inputs
    if (!config.name || !config.symbol) {
      throw new Error('Token name and symbol are required');
    }

    if (config.symbol.length < 2 || config.symbol.length > 5) {
      throw new Error('Token symbol should be 2-5 characters');
    }

    if (config.decimals < 0 || config.decimals > 18) {
      throw new Error('Decimals should be between 0 and 18');
    }

    if (config.initialSupply <= 0) {
      throw new Error('Initial supply must be greater than 0');
    }

    // Save configuration
    const configPath = path.join(process.cwd(), 'token-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log('\n✅ Token configuration saved!');
    console.log('\n📊 Your Token Configuration:');
    console.log(`   Name: ${config.name}`);
    console.log(`   Symbol: ${config.symbol}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Decimals: ${config.decimals}`);
    console.log(`   Initial Supply: ${config.initialSupply.toLocaleString()}`);
    console.log(`   Config saved to: ${configPath}`);

    console.log('\n🚀 Next steps:');
    console.log('1. Make sure you have SOL in your wallet (for transaction fees)');
    console.log('2. Run: npm run mint-token');
    console.log('3. Your token will be created on Solana devnet');

  } catch (error) {
    console.error('❌ Configuration error:', error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
  }
};

// Run if called directly
if (require.main === module) {
  configureToken();
}

export default configureToken; 