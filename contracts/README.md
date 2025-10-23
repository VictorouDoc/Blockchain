## Overview

The `contracts/` folder contains all Solidity smart contracts for the Real Estate Tokenization Platform, including ERC-20 tokens for fractional property ownership, ERC-721 NFTs for property certificates, and KYC compliance contracts.

## Contracts

### 1. KYCRegistry.sol

* Manages whitelisted and blacklisted addresses.
* Enforces KYC compliance for all transfers.
* Owner-only controls for admin functions.

### 2. RealEstateToken.sol (RES)

* ERC-20 token representing fractional ownership of a property.
* Total supply: 1000 RES (1 RES = $500 property value).
* KYC-enforced transfers.

### 3. PropertyNFT.sol

* ERC-721 token for unique property certificates.
* Metadata stored on IPFS (address, area, value, images).
* KYC-enforced transfers.

### 4. SimpleTokenFactory.sol

* Factory contract to create new ERC-20 or ERC-721 tokens.
* Enables easy expansion of the platform to multiple properties.

### 5. interfaces/

* Contains Uniswap V2 interfaces for DEX integration.

## Notes

* Contracts use Solidity 0.8.20.
* On-chain KYC enforcement ensures secure token transfers.
* Factory pattern allows scalable token deployment.
