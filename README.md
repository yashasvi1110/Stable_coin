# 🪙 Solana Token Creator

A complete toolkit for creating SPL tokens on the Solana blockchain using Metaplex and Umi framework.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create a Wallet (if you don't have one)
```bash
npm run create-wallet
```

### 3. Get Devnet SOL
After creating your wallet, you'll need SOL for transaction fees:
- Visit: https://faucet.solana.com/
- Or use CLI: `solana airdrop 2 <YOUR_PUBLIC_KEY> --url devnet`

### 4. Configure Your Token
```bash
npm run configure-token
```
This interactive script will help you set:
- Token name
- Token symbol (3-4 characters)
- Description
- Decimals (default: 9)
- Initial supply

### 5. Create Your Token
```bash
npm run mint-token
```

## 📁 Project Structure

```
solana-token/
├── src/
│   ├── scripts/
│   │   ├── create-wallet.ts      # Create Solana wallet
│   │   ├── configure-token.ts    # Interactive token configuration
│   │   └── mint-token.ts         # Create and mint token
│   └── utils/
│       ├── connection.ts         # Solana connection setup
│       └── keypair.ts           # Wallet management
├── keypairs/                    # Stored wallet keypairs
└── token-config.json           # Token configuration (generated)
```

## 🛠️ Available Scripts

- `npm run create-wallet` - Create a new Solana wallet
- `npm run configure-token` - Configure your token settings
- `npm run mint-token` - Create and mint your token
- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run mint-token in development mode

## 🔧 Configuration

### Token Settings
You can configure your token in two ways:

1. **Interactive Configuration** (Recommended):
   ```bash
   npm run configure-token
   ```

2. **Manual Configuration**:
   Edit `src/scripts/mint-token.ts` and modify the `TOKEN_CONFIG` object:
   ```typescript
   const TOKEN_CONFIG = {
     name: 'YourTokenName',
     symbol: 'YTK',
     description: 'Your token description',
     decimals: 9,
     initialSupply: 1_000_000_000
   };
   ```

### Environment Variables
Create a `.env` file for custom RPC endpoint:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 🌐 Networks

- **Devnet** (Default): For testing and development
- **Mainnet**: For production tokens (requires real SOL)

## 📊 Token Information

After successful token creation, you'll get:
- **Mint Address**: Your token's unique identifier
- **Token Account**: Your wallet's token account
- **Metadata URI**: Token metadata location
- **Transaction IDs**: Creation and minting transactions
- **Explorer Links**: View your token on Solana Explorer

## 🔍 View Your Token

After creation, view your token on:
- **Devnet Explorer**: https://explorer.solana.com/?cluster=devnet
- **Mainnet Explorer**: https://explorer.solana.com/

## 💡 Features

- ✅ **Metaplex Integration**: Full metadata support
- ✅ **Umi Framework**: Modern Solana development
- ✅ **TypeScript**: Type-safe development
- ✅ **Interactive Setup**: Easy configuration
- ✅ **Devnet Support**: Safe testing environment
- ✅ **Error Handling**: Comprehensive error messages
- ✅ **Transaction Logging**: Detailed operation logs

## 🚨 Important Notes

1. **Keep Your Keys Safe**: The `keypairs/` folder contains sensitive wallet information
2. **Test on Devnet**: Always test your token on devnet before mainnet
3. **Transaction Fees**: You need SOL in your wallet for transaction fees
4. **Token Supply**: Consider your token economics carefully
5. **Metadata**: Token metadata is permanently stored on Arweave

## 🆘 Troubleshooting

### Common Issues

1. **Insufficient SOL**: Get devnet SOL from the faucet
2. **Network Issues**: Check your internet connection
3. **Invalid Configuration**: Ensure token symbol is 2-5 characters
4. **Transaction Failures**: Check Solana network status

### Error Messages

- `Failed to load keypair`: Wallet file not found
- `Insufficient funds`: Need more SOL for fees
- `Invalid mint`: Token configuration error

## 🔗 Useful Links

- [Solana Documentation](https://docs.solana.com/)
- [Metaplex Documentation](https://docs.metaplex.com/)
- [Umi Framework](https://umi.xyz/)
- [Solana Explorer](https://explorer.solana.com/)
- [Devnet Faucet](https://faucet.solana.com/)

## 📄 License

ISC License

---

**Happy Token Creating! 🎉** 