# 🏠 Real Estate Tokenization Platform

A complete blockchain platform for tokenizing real estate assets on **Ethereum Sepolia testnet** with KYC compliance, DEX trading, and real-time pricing.

## 📋 Project Overview

This platform enables:
- **Tokenize real estate assets** as ERC-20 tokens (fractional ownership) and ERC-721 NFTs (property certificates)
- **KYC compliance** with on-chain whitelist/blacklist registry
- **DEX trading** via Uniswap V2 with automated market-making
- **Real-time price oracle** for RES token valuation
- **Blockchain indexer** for event tracking and analytics
- **Modern web interface** with Web3 wallet integration

## ✅ Fully Implemented Features

### Smart Contracts (Sepolia Testnet)
- ✅ **KYCRegistry** (`0xFfc2bd2AbC7b4e86F306F659e2Caf219744e30a2`)
  - Whitelist/blacklist management
  - Access control for compliant trading

- ✅ **RealEstateToken (RES)** (`0x6cBf802Ba94639Bb74E64e883D9FCb80114F17EF`)
  - ERC-20 token representing 1/1000th ownership of $500k property
  - 1000 RES total supply (1 RES = $500 property value)
  - KYC-enforced transfers

- ✅ **PropertyNFT** (`0x28304461fb1e65EDDcb8998195B47EC770A447CD`)
  - ERC-721 NFT for unique property certificates
  - IPFS metadata support

- ✅ **SimpleTokenFactory** (`0xF62643BD23124c7f279D5f2073956039ba44699C`)
  - Factory for creating new ERC-20 and ERC-721 tokens

### DEX Integration (Uniswap V2 on Sepolia)
- ✅ **Liquidity Pool**: RES/WETH pair (`0x8DB5219a28376ff2bEd277459D6845EcF115f813`)
- ✅ **Router**: Whitelisted for KYC compliance (`0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3`)
- ✅ **Active liquidity**: 100 RES + 0.01 ETH
- ✅ **Functional trading**: Swap ETH ↔ RES with live pricing

### Backend Services
- ✅ **Oracle Service** (Port 3001)
  - Real-time RES token pricing via Uniswap V2 reserves
  - XRP/USD reference price from CoinGecko
  - Auto-updates every 60 seconds
  - REST API for price queries

- ✅ **Indexer Service** (Port 3002)
  - Monitors KYC events (Whitelist/Blacklist)
  - Tracks RES token transfers
  - Syncs blockchain state every 60 seconds
  - REST API for event queries

### Frontend (React + RainbowKit + Wagmi)
- ✅ **Modern UI** with purple crypto theme (Uniswap-style)
- ✅ **Wallet integration** via RainbowKit (MetaMask, WalletConnect, etc.)
- ✅ **Portfolio dashboard** with real-time balances and valuations
- ✅ **Token creation** interface for ERC-20 and ERC-721
- ✅ **DEX trading** interface with live swap functionality
- ✅ **KYC status checker** for address verification
- ✅ **Responsive design** with glassmorphism and gradients

### Testing & Quality
- ✅ **Unit tests** for all contracts (10 tests passing)
- ✅ **Integration tests** for end-to-end workflows
- ✅ **Manual testing** completed on Sepolia testnet

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MetaMask wallet
- Sepolia ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))

### 1. Clone and Install
```bash
git clone https://github.com/VictorouDoc/Blockchain.git
cd Blockchain

# Install blockchain dependencies
cd blockchain && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Environment Configuration

**Root `.env`** (for blockchain deployment):
```bash
PRIVATE_KEY=your_metamask_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

**Frontend `.env`** (already configured in `frontend/.env`):
```bash
# WalletConnect
VITE_WC_PROJECT_ID=922ffe9f4c90b8ee4d892f4df830abf9

# Network
VITE_NETWORK=sepolia
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Contract addresses
VITE_KYC_REGISTRY_ADDRESS=0xFfc2bd2AbC7b4e86F306F659e2Caf219744e30a2
VITE_ERC20_ADDRESS=0x6cBf802Ba94639Bb74E64e883D9FCb80114F17EF
VITE_ERC721_ADDRESS=0x28304461fb1e65EDDcb8998195B47EC770A447CD
VITE_TOKEN_FACTORY_ADDRESS=0xF62643BD23124c7f279D5f2073956039ba44699C

# Uniswap V2 on Sepolia
VITE_UNISWAP_ROUTER=0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3
VITE_UNISWAP_FACTORY=0xF62c03E08ada871A0bEb309762E260a7a6a880E6
VITE_WETH=0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
VITE_RES_WETH_PAIR=0x8DB5219a28376ff2bEd277459D6845EcF115f813

# Backend services
VITE_ORACLE_BASE_URL=http://localhost:3001
VITE_INDEXER_BASE_URL=http://localhost:3002
```

### 3. Run the Platform

**Terminal 1 - Backend Services:**
```bash
cd backend
npm run dev
```
This starts:
- Oracle on http://localhost:3001
- Indexer on http://localhost:3002

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend available at http://localhost:5173

### 4. Using the Platform

1. **Connect wallet** - Click "Connect Wallet" and select MetaMask (switch to Sepolia testnet)
2. **Check KYC status** - Verify your address is whitelisted (contact admin if not)
3. **View portfolio** - See your RES balance, NFT count, and estimated value
4. **Trade tokens** - Use the Trading tab to swap ETH ↔ RES
5. **Create tokens** - Use Token Creation tab to deploy new ERC-20 or ERC-721 contracts

## 📁 Project Structure

```
Blockchain/
├── contracts/                      # Solidity smart contracts
│   ├── KYCRegistry.sol            # Whitelist/blacklist registry
│   ├── RealEstateToken.sol        # ERC-20 token for property shares
│   ├── PropertyNFT.sol            # ERC-721 for property certificates
│   ├── SimpleTokenFactory.sol     # Token factory contract
│   └── interfaces/                # Uniswap V2 interfaces
├── blockchain/
│   ├── scripts/
│   │   ├── deploy-sepolia.js      # Deploy all contracts to Sepolia
│   │   ├── create-pair-sepolia.js # Create Uniswap V2 pair
│   │   ├── add-liquidity-sepolia.js # Add liquidity to pool
│   │   └── whitelist-router.js    # Whitelist Uniswap contracts
│   ├── test/
│   │   └── SmartContracts.test.js # Contract unit tests
│   ├── deployments/
│   │   └── sepolia-latest.json    # Deployed contract addresses
│   └── hardhat.config.js
├── backend/
│   ├── oracle.js                  # Price oracle service (port 3001)
│   ├── indexer.js                 # Blockchain indexer (port 3002)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── Portfolio.jsx      # Balance & valuation dashboard
│   │   │   ├── TradingInterface.jsx # DEX swap interface
│   │   │   ├── TokenCreation.jsx  # Token factory UI
│   │   │   └── KYCStatus.jsx      # KYC checker
│   │   ├── hooks/
│   │   │   ├── useContracts.js    # Contract configs & ABIs
│   │   │   └── useOracle.js       # Price oracle hook
│   │   ├── config/
│   │   │   └── wagmi.js           # Web3 configuration
│   │   ├── App.jsx                # Main app component
│   │   └── index.css              # Purple crypto theme styles
│   ├── .env                       # Frontend environment config
│   └── package.json
└── README.md                      # This file
```

## 🛠️ Development Commands

### Smart Contracts
```bash
cd blockchain

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
node scripts/deploy-sepolia.js

# Create DEX pair
node scripts/create-pair-sepolia.js

# Add liquidity
node scripts/add-liquidity-sepolia.js

# KYC Management
node scripts/whitelist-address.js <address>  # Whitelist any address
node scripts/whitelist-router.js            # Whitelist Uniswap contracts
```

### Backend Services
```bash
cd backend

# Start both services
npm run dev

# Start oracle only
npm run oracle

# Start indexer only
npm run indexer
```

### Frontend
```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

## 🤔 Technical Choices & Architecture

### Why Ethereum Sepolia?
- ✅ Mature ecosystem with battle-tested tools (Hardhat, ethers.js)
- ✅ Official Uniswap V2 deployment available
- ✅ Reliable and well-documented testnet
- ✅ Easy access to faucets for testing
- ✅ Large developer community for support

### Architecture Decisions
1. **Smart Contracts**
   - Solidity 0.8.20 for latest security features
   - Modular design with separate contracts for KYC, tokens, and factory
   - On-chain KYC enforcement for maximum security
   - Factory pattern for easy token creation

2. **Frontend**
   - React + Vite for fast development and better DX
   - RainbowKit + Wagmi for seamless wallet integration
   - TailwindCSS for responsive design
   - Real-time blockchain state updates

3. **Backend Services**
   - Lightweight Node.js services
   - Modular architecture (oracle + indexer)
   - REST APIs for easy integration
   - 60-second sync intervals for optimal performance

4. **Development Workflow**
   - Hardhat for contract development
   - Comprehensive test suite
   - Clear deployment scripts
   - Easy-to-use admin tools

### Security Considerations
1. **KYC System**
   - On-chain verification for all transfers
   - Whitelist/blacklist mechanisms
   - Admin controls for compliance

2. **Trading Security**
   - Only whitelisted addresses can trade
   - DEX integration with verified contracts
   - Price oracle for fair valuations

## 🌐 API Endpoints

### Oracle Service (http://localhost:3001)
- `GET /api/price/xrp` - XRP/USD price from CoinGecko
- `GET /api/price/res` - RES token price from Uniswap V2
- `GET /api/health` - Service health check

### Indexer Service (http://localhost:3002)
- `GET /api/events/kyc` - KYC whitelist/blacklist events
- `GET /api/events/transfers` - RES token transfer events
- `GET /api/stats` - Blockchain statistics
- `GET /api/health` - Service health check

## 📝 Smart Contract Details

### RealEstateToken (RES)
- **Symbol**: RES
- **Decimals**: 18
- **Total Supply**: 1,000 RES
- **Property Value**: $500,000 USD
- **Price per Token**: $500/RES (1 RES = 0.001 property ownership)
- **Property**: 123 Main St, Paris
- **KYC**: Required for all transfers

### KYCRegistry
- **Owner-only controls**: Only contract owner can whitelist/blacklist
- **Whitelisted addresses**: Can send/receive RES tokens and NFTs
- **Blacklisted addresses**: Blocked from all token operations
- **Uniswap integration**: Router and Pair contracts whitelisted

### PropertyNFT
- **Standard**: ERC-721
- **Use case**: Unique property certificates
- **Metadata**: IPFS-stored (address, area, value, images)
- **KYC**: Enforced on transfers

## 🧪 Testing

All smart contracts have comprehensive test coverage:

```bash
cd blockchain
npx hardhat test
```

**Test results:**
```
✓ KYCRegistry: Should deploy with correct owner
✓ KYCRegistry: Should whitelist address
✓ KYCRegistry: Should blacklist address
✓ RealEstateToken: Should deploy with correct name and symbol
✓ RealEstateToken: Should mint tokens to owner
✓ RealEstateToken: Should enforce KYC on transfers
✓ PropertyNFT: Should deploy correctly
✓ PropertyNFT: Should mint NFT with metadata
✓ PropertyNFT: Should enforce KYC on transfers
✓ Integration: Full workflow test

10 passing
```

## 🔗 Deployed Contracts (Sepolia)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| KYCRegistry | `0xFfc2bd2AbC7b4e86F306F659e2Caf219744e30a2` | [View](https://sepolia.etherscan.io/address/0xFfc2bd2AbC7b4e86F306F659e2Caf219744e30a2) |
| RealEstateToken | `0x6cBf802Ba94639Bb74E64e883D9FCb80114F17EF` | [View](https://sepolia.etherscan.io/address/0x6cBf802Ba94639Bb74E64e883D9FCb80114F17EF) |
| PropertyNFT | `0x28304461fb1e65EDDcb8998195B47EC770A447CD` | [View](https://sepolia.etherscan.io/address/0x28304461fb1e65EDDcb8998195B47EC770A447CD) |
| TokenFactory | `0xF62643BD23124c7f279D5f2073956039ba44699C` | [View](https://sepolia.etherscan.io/address/0xF62643BD23124c7f279D5f2073956039ba44699C) |
| RES/WETH Pair | `0x8DB5219a28376ff2bEd277459D6845EcF115f813` | [View](https://sepolia.etherscan.io/address/0x8DB5219a28376ff2bEd277459D6845EcF115f813) |

## 👥 Team

- **Victor** - Lead Blockchain Engineer (Smart Contracts, DEX, Testing)
- **Bastien** - Frontend Developer (React, UI/UX, Web3)
- **Sean** - Backend Developer (Oracle, Indexer, APIs)
- **Theo** - DevOps Engineer (Deployment, CI/CD, Documentation)

## 🎯 Project Goals Achieved

✅ Real estate asset tokenization (ERC-20 + ERC-721)
✅ On-chain KYC compliance system
✅ Decentralized trading via Uniswap V2
✅ Real-time price oracle integration
✅ Blockchain event indexer
✅ Modern responsive web interface
✅ Comprehensive testing suite
✅ Full Sepolia testnet deployment
✅ Production-ready architecture

## 📚 Technical Stack

- **Blockchain**: Ethereum (Sepolia testnet)
- **Smart Contracts**: Solidity 0.8.20
- **Development**: Hardhat
- **Testing**: Mocha, Chai
- **Frontend**: React, Vite, TailwindCSS
- **Web3**: RainbowKit, Wagmi, Viem
- **Backend**: Node.js, Express, Ethers.js
- **DEX**: Uniswap V2
- **Oracle**: CoinGecko API + Uniswap reserves

## 📄 License

ISC

## 🔗 Useful Links

- [Hardhat Documentation](https://hardhat.org/docs)
- [Sepolia Testnet Faucet](https://sepoliafaucet.com/)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [Uniswap V2 Docs](https://docs.uniswap.org/contracts/v2/overview)
- [RainbowKit](https://www.rainbowkit.com/)
- [Wagmi](https://wagmi.sh/)
