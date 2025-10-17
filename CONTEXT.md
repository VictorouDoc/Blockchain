# CONTEXT.md - Session Tracking

## 📅 Session du 2025-10-17

### État initial
- Smart contracts créés : KYCRegistry, RealEstateToken, PropertyNFT
- Scripts de déploiement et setup liquidity DEX prêts
- Tests unitaires (10 tests) passent
- Interfaces Uniswap V2 intégrées
- Problème : pas assez de POL pour tester sur Amoy

### Actions effectuées
1. ✅ Créé CONTEXT.md pour tracking sessions
2. ✅ Créé .env.example template
3. ✅ Installé dépendances npm (197 packages)
4. ✅ Compilé smart contracts (Solidity 0.8.20)
5. ✅ Obtenu POL tokens sur wallet : `0x5729471EE51FaEaF31fc093fd99E67f28429bf00`
6. ✅ Déployé sur Amoy testnet (2/3 contrats):
   - **KYCRegistry**: `0x9289e12AEC53F3794608aB3C15f4103Ddf30A9E4`
   - **RealEstateToken**: `0xC6D48cfd979d03bF5261944DfF3ab81e17207C00`
   - **PropertyNFT**: ⏳ En attente (besoin plus de POL)
7. ✅ Créé deployment JSON: `deployments/amoy-1729177200000.json`
8. ✅ Setup infrastructure DEX (DonaSwap V2 sur Amoy):
   - Paire RES/WMATIC créée: `0x34b250940c88764c72Ab5DE28AEA9C6DfFaa1c8C`
   - Router whitelisté: `0x6E682B51F8bb67294B522b75a1E79dDd4502cc94`
   - Factory: `0x8e5dff1c121F661971d02950698f8c5EFc3DfA78`
   - Liquidité initiale: En attente (limitations testnet)
9. ✅ **ORACLE SERVICE** créé et testé:
   - Prix XRP/USD en temps réel (CoinGecko API)
   - Prix RES calculé basé sur valeur propriété
   - API REST sur port 3001
   - Updates toutes les 60 secondes
10. ✅ **INDEXER SERVICE** créé:
   - Synchronise événements KYC (Whitelist/Blacklist)
   - Synchronise Transfers RES tokens
   - API REST sur port 3002
   - Sync toutes les 60 secondes

### Prochaines sessions
- [ ] Finaliser ajout liquidité DEX (besoin plus de POL ou utiliser autre DEX)
- [ ] Déployer PropertyNFT (besoin plus de POL)
- [ ] Créer frontend React/Next.js (optionnel mais recommandé)
- [ ] Documentation finale du projet

---

## 📋 Rappels techniques

### Déploiement Amoy
```bash
npx hardhat run scripts/deploy.js --network amoy
```

### Setup Pool DEX
```bash
npx hardhat run scripts/setup-liquidity.js --network amoy
```

### Adresses importantes
- QuickSwap Router (Amoy): `0x8954AfA98594b838bda56FE4C12a09D7739D179b`
- QuickSwap Factory (Amoy): `0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32`
- Wallet de test: `0x5729471EE51FaEaF31fc093fd99E67f28429bf00`

### Architecture
- **KYCRegistry**: Whitelist/blacklist on-chain
- **RealEstateToken**: ERC-20 avec KYC enforcement
- **PropertyNFT**: ERC-721 avec KYC enforcement
- **DEX**: QuickSwap (fork Uniswap V2) avec pool RES/WMATIC

---

## 🎯 Objectifs du projet (Final Project)

### Core Requirements
1. ✅ Tokenization (ERC-20 + ERC-721)
2. ✅ KYC/Compliance on-chain
3. ⏳ Token Trading sur DEX (en cours)
4. ❌ Real-time indexer
5. ❌ Oracle pour pricing
6. ❌ Frontend
7. ❌ Backend/API

### Délai
- 5 semaines (~120-150h total)
- Équipe: Victor (lead blockchain), Bastien (frontend), Sean (backend/indexer), Theo (DevOps)
