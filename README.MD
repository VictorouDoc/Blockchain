# 🏠 Tokenized Asset Management Platform

Real estate tokenization platform on Polygon (EVM-compatible blockchain).

## 📋 Project Overview

This platform enables:
- **Tokenize real estate assets** as ERC-20 tokens (fractional shares) and ERC-721 NFTs (unique properties)
- **Manage KYC compliance** with on-chain whitelist/blacklist
- **Trade tokens** between whitelisted users
- **Track transactions** in real-time via indexer
- **Get price feeds** via decentralized oracle

### ✅ Currently Implemented:

- ✅ **Smart Contracts** (100%):
  - `KYCRegistry.sol` - KYC management with whitelist/blacklist
  - `RealEstateToken.sol` - ERC-20 token for real estate shares
  - `PropertyNFT.sol` - ERC-721 NFT for unique properties

- ✅ **Automated deployment** on Polygon Amoy testnet

- ✅ **DEX Integration** (DonaSwap V2 on Amoy):
  - Pair created: RES/WMATIC (`0x34b250940c88764c72Ab5DE28AEA9C6DfFaa1c8C`)
  - Router and pair whitelisted for KYC compliance
  - Infrastructure ready (liquidity pending testnet limitations)

- ✅ **Oracle Service** (Real-time pricing):
  - XRP/USD price from CoinGecko API
  - RES token price calculation
  - REST API on port 3001
  - Auto-updates every 60 seconds

- ✅ **Indexer Service** (Blockchain synchronization):
  - Monitors KYC events (Whitelist/Blacklist)
  - Tracks RES token transfers
  - REST API on port 3002
  - Syncs every 60 seconds

- ✅ **Comprehensive Tests** (10 tests passing):
  - KYCRegistry whitelist/blacklist tests
  - RealEstateToken deployment and transfer tests
  - PropertyNFT minting and metadata tests
  - Full integration test (all contracts working together)

### 🚧 Remaining (Optional):

- ⏳ Frontend (React/Next.js) - Bastien
- ⏳ PropertyNFT deployment (waiting for more POL)
- ⏳ DEX liquidity addition (testnet limitations)

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+
- Git
- Metamask wallet (for testnet)

### 1. Clone the repository
```bash
git clone https://github.com/VictorouDoc/Blockchain.git
cd Blockchain
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment configuration (for testnet)
Create a `.env` file at the root:
```bash
PRIVATE_KEY=your_metamask_private_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

⚠️ **IMPORTANT**: Never commit the `.env` file (already in .gitignore)

## 🔨 Compiling Contracts

To compile all Solidity smart contracts:

```bash
npx hardhat compile
```

This will:
- Compile all `.sol` files in `contracts/`
- Generate artifacts (ABI + bytecode) in `artifacts/`
- Create cache in `cache/`
- Display compilation errors/warnings

## 🧪 Local Testing

### Option 1: Hardhat Network (in-memory - fast)
```bash
npx hardhat run scripts/deploy.js --network hardhat
```
- Deploys contracts to a temporary network
- Disappears after execution
- Perfect for quick testing

### Option 2: Hardhat Local Node (persistent)

**Terminal 1 - Start local node:**
```bash
npx hardhat node
```
This starts a local blockchain at `http://127.0.0.1:8545` with:
- 20 test accounts with ETH
- Real-time transaction display
- Stays active until `Ctrl+C`

**Terminal 2 - Deploy to localhost:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

Deployed contract addresses are saved in `deployments/`

## 🌐 Deployment to Polygon Amoy (Testnet)

### 1. Get test POL tokens
- Go to [Polygon Faucet](https://faucet.polygon.technology/)
- Enter your Metamask address
- Receive free POL for Amoy testnet

### 2. Configure your `.env`
```bash
PRIVATE_KEY=your_private_key_here
POLYGONSCAN_API_KEY=your_api_key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

### 3. Deploy to Amoy
```bash
npx hardhat run scripts/deploy.js --network amoy
```

The script will:
1. Deploy `KYCRegistry`
2. Deploy `RealEstateToken` (1000 shares of a property)
3. Deploy `PropertyNFT`
4. Whitelist the deployer
5. Mint an example NFT
6. Verify contracts on Polygonscan (after 30s)
7. Save addresses to `deployments/amoy-timestamp.json`

## 📁 Project Structure

```
Blockchain/
├── contracts/              # Solidity smart contracts
│   ├── KYCRegistry.sol    # Whitelist/blacklist management
│   ├── RealEstateToken.sol # ERC-20 token
│   ├── PropertyNFT.sol     # ERC-721 NFT
│   └── interfaces/         # Uniswap V2 interfaces
├── backend/                # Backend services
│   ├── oracle.js          # Price oracle service (port 3001)
│   ├── indexer.js         # Blockchain indexer (port 3002)
│   ├── package.json       # Backend dependencies
│   └── README.md          # Backend documentation
├── scripts/
│   ├── deploy.js          # Deployment script
│   ├── deploy-direct.js   # Direct deployment (ethers.js)
│   └── setup-liquidity-direct.js # DEX pool setup
├── test/                  # Unit tests (10 tests passing)
├── deployments/           # Deployed contract addresses
├── hardhat.config.js      # Hardhat configuration
├── CONTEXT.md             # Session tracking
├── .env                   # Environment variables (create this)
└── README.md              # This file
```

## 📝 Smart Contract Architecture

### KYCRegistry
- Manages whitelist of authorized users
- Blacklist to revoke access
- Only owner can whitelist/blacklist

### RealEstateToken (ERC-20)
- Fungible token representing shares of a property
- **Example property**: 123 Avenue des Champs-Élysées, Paris
- **Value**: $500,000
- **Supply**: 1000 tokens (1 token = 1 share)
- Transfers blocked if sender/recipient not whitelisted

### PropertyNFT (ERC-721)
- Unique NFT representing a property certificate
- Metadata: address, area, value, IPFS URIs
- Transfers subject to KYC verification

## 🛠️ Useful Commands

### Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Clean artifacts
npx hardhat clean

# Run tests
npx hardhat test

# Deploy to testnet
node scripts/deploy-direct.js

# Setup liquidity pool
node scripts/setup-liquidity-direct.js
```

### Backend Services

```bash
# Install backend dependencies
cd backend && npm install

# Start Oracle service (port 3001)
cd backend && npm run oracle

# Start Indexer service (port 3002)
cd backend && npm run indexer

# Start both services
cd backend && npm run dev
```

### API Endpoints

**Oracle (http://localhost:3001)**
- `GET /api/price/xrp` - XRP/USD price
- `GET /api/price/res` - RES token price
- `GET /api/health` - Service health

**Indexer (http://localhost:3002)**
- `GET /api/events/kyc` - KYC events
- `GET /api/events/transfers` - Transfer events
- `GET /api/stats` - Blockchain statistics
- `GET /api/health` - Service health

## 🏊 DEX Trading

Once deployed, tokens can be traded on **QuickSwap** (Uniswap V2 fork on Polygon).

### Setup liquidity:
```bash
npx hardhat run scripts/setup-liquidity.js --network amoy
```

This creates a RES/WMATIC pool with:
- Initial liquidity: 100 RES + 0.1 MATIC
- KYC enforcement (only whitelisted can trade)
- Whitelisted router and pair contracts

**Full guide**: See `docs/DEX_INTEGRATION.md`

## 👥 Team

- **Victor** - Lead Blockchain (Smart Contracts, DEX, Tests)
- **Bastien** - Lead Frontend (React/Next.js, UI/UX)
- **Sean** - Backend/Indexer (Node.js, Oracle, API)
- **Theo** - DevOps/QA (CI/CD, Deployment, Documentation)

## 📚 Next Steps

1. ✅ ~~Implement Uniswap pool for token trading~~
2. ⏳ Write comprehensive tests (Hardhat) - **PRIORITY**
3. ⏳ Create indexer for blockchain synchronization - Sean
4. ⏳ Integrate oracle for pricing - Sean
5. ⏳ Develop frontend - Bastien
6. ⏳ Document technical choices (Polygon justification)

## 📄 License

ISC

## 🔗 Useful Links

- [Hardhat Documentation](https://hardhat.org/docs)
- [Polygon Amoy Faucet](https://faucet.polygon.technology/)
- [Polygonscan Amoy](https://amoy.polygonscan.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
