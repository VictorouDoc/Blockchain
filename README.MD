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

- ✅ **Automated deployment** on Hardhat/Localhost/Polygon Amoy

- ✅ **DEX Integration** (QuickSwap/Uniswap V2):
  - Liquidity pool setup script
  - KYC enforcement on trading
  - Full documentation in `docs/DEX_INTEGRATION.md`

- ✅ **Comprehensive Tests** (10 tests passing):
  - KYCRegistry whitelist/blacklist tests
  - RealEstateToken deployment and transfer tests
  - PropertyNFT minting and metadata tests
  - Full integration test (all contracts working together)

### 🚧 Coming Soon:

- ⏳ Indexer for real-time synchronization - Sean
- ⏳ Oracle for asset pricing - Sean
- ⏳ Frontend (React/Next.js) - Bastien
- ⏳ Backend/API - Sean

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
│       ├── IUniswapV2Router02.sol
│       ├── IUniswapV2Factory.sol
│       ├── IUniswapV2Pair.sol
│       └── IWETH.sol
├── scripts/
│   ├── deploy.js          # Deployment script
│   └── setup-liquidity.js # DEX pool setup
├── test/                  # Tests (to be completed)
├── deployments/           # Deployed contract addresses & pool info
├── docs/                  # Documentation
│   └── DEX_INTEGRATION.md # DEX setup guide
├── hardhat.config.js      # Hardhat configuration
├── .env                   # Environment variables (create this)
└── README.md
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

```bash
# Compile contracts
npx hardhat compile

# Clean artifacts
npx hardhat clean

# Run tests
npx hardhat test

# Deploy locally
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.js --network amoy

# Setup liquidity pool (after deployment)
npx hardhat run scripts/setup-liquidity.js --network amoy

# Hardhat console
npx hardhat console --network localhost
```

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
