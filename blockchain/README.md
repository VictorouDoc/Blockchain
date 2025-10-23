## Overview

The `blockchain/` folder contains deployment scripts, Hardhat configuration, tests, and other blockchain-related logic for the Real Estate Tokenization Platform.

## Folder Structure

```
blockchain/
├── scripts/
│   ├── deploy-sepolia.js      # Deploy all contracts to Sepolia
│   ├── create-pair-sepolia.js # Create Uniswap V2 pair
│   ├── add-liquidity-sepolia.js # Add liquidity to pool
│   └── whitelist-router.js    # Whitelist Uniswap router
├── test/
│   └── SmartContracts.test.js # Unit tests
├── deployments/
│   └── sepolia-latest.json    # Deployed contract addresses
└── hardhat.config.js           # Hardhat configuration
```

## Scripts

* **deploy-sepolia.js**: Deploy all platform contracts.
* **create-pair-sepolia.js**: Create RES/WETH pair on Uniswap V2.
* **add-liquidity-sepolia.js**: Add liquidity to the RES/WETH pool.
* **whitelist-router.js**: Whitelist Uniswap contracts for KYC compliance.

## Running Tests

```bash
cd blockchain
npx hardhat test
```

## Environment Variables

* `PRIVATE_KEY`: Ethereum wallet private key for deployment.
* `ETHERSCAN_API_KEY`: Optional, for contract verification.
* `SEPOLIA_RPC_URL`: RPC endpoint for Sepolia network.

## Notes

* Hardhat is used for contract compilation, testing, and deployment.
* Scripts can be run individually for specific deployment or setup tasks.
* Deployed addresses are stored in `deployments/sepolia-latest.json`.

## Recommended Workflow

1. Compile contracts: `npx hardhat compile`
2. Run tests: `npx hardhat test`
3. Deploy contracts: `node scripts/deploy-sepolia.js`
4. Set up Uniswap pair & liquidity: `node scripts/create-pair-sepolia.js && node scripts/add-liquidity-sepolia.js`
5. Whitelist router for KYC: `node scripts/whitelist-router.js`
