# Frontend - Real Estate Tokenization Platform

This is the **React + Vite frontend** for the Real Estate Tokenization Platform, providing a modern web interface to interact with blockchain tokenized real estate assets, view portfolios, perform trades on a DEX, and manage KYC status.

## Features

* **React + Vite** setup with fast HMR
* **Wallet integration** via RainbowKit (MetaMask, WalletConnect, etc.)
* **Portfolio dashboard**: real-time RES token balances, NFT holdings, and property valuations
* **DEX trading interface**: swap ETH ↔ RES tokens using Uniswap V2
* **Token creation UI**: deploy new ERC-20 and ERC-721 contracts
* **KYC verification**: check if an address is whitelisted for trading
* **Responsive design** with gradients and glassmorphism styles

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Portfolio.jsx      # Balance & valuation dashboard
│   │   ├── TradingInterface.jsx # DEX swap interface
│   │   ├── TokenCreation.jsx  # Token factory UI
│   │   └── KYCStatus.jsx      # KYC checker
│   ├── hooks/                # Custom React hooks
│   │   ├── useContracts.js    # Contract ABIs & configs
│   │   └── useOracle.js       # Price oracle integration
│   ├── config/               # Web3 & RainbowKit configuration
│   │   └── wagmi.js
│   ├── App.jsx               # Main app component
│   └── index.css             # Global styles
├── .env                     # Frontend environment variables
└── package.json              # Dependencies
```

## Environment Variables

Make sure to configure the following in `frontend/.env`:

```
# WalletConnect project ID
VITE_WC_PROJECT_ID=your_project_id

# Ethereum network and RPC
VITE_NETWORK=sepolia
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Smart contract addresses
VITE_KYC_REGISTRY_ADDRESS=0x...
VITE_ERC20_ADDRESS=0x...
VITE_ERC721_ADDRESS=0x...
VITE_TOKEN_FACTORY_ADDRESS=0x...

# Uniswap V2 addresses on Sepolia
VITE_UNISWAP_ROUTER=0x...
VITE_UNISWAP_FACTORY=0x...
VITE_WETH=0x...
VITE_RES_WETH_PAIR=0x...

# Backend services
VITE_ORACLE_BASE_URL=http://backend_url:3001
VITE_INDEXER_BASE_URL=http://backend_url:3002
```

## Running Locally

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start development server

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 3. Build for production

```bash
npm run build
```

This generates static files in the `dist/` directory.

### 4. Preview production build

```bash
npm run preview
```

## Deployment

The frontend can be deployed on **Vercel** or any static hosting provider.

* Connect your GitHub repository to Vercel.
* Set build command: `npm run build`
* Set output directory: `dist`
* Configure environment variables on Vercel.

## Notes

* This frontend communicates with the backend API to fetch blockchain data, prices, and KYC events.
* Ensure your backend is deployed and publicly accessible for full functionality.
* ESLint and optional React Compiler configurations are available if extending the project.

## Technical Stack

* **React**
* **Vite**
* **RainbowKit + Wagmi** for Web3 wallet integration
* **JavaScript / JSX**
* **CSS** with gradients & glassmorphism

## Useful Links

* [React](https://reactjs.org/)
* [Vite](https://vitejs.dev/)
* [RainbowKit](https://www.rainbowkit.com/)
* [Wagmi](https://wagmi.sh/)
