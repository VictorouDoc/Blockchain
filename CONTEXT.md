# CONTEXT.md - Session Tracking

## 📅 Session du 2025-10-17 (Suite - Réorganisation)

### État au début de cette session
- Smart contracts déployés (KYCRegistry, RealEstateToken)
- Oracle + Indexer services créés (simple version)
- DEX infrastructure créée mais liquidité non ajoutée
- Tests passent (10 tests)
- Branches découvertes: `frontend` (Bastien) et `back` (Sean)
- Besoin: réorganiser avant de merger les branches

### Actions effectuées dans cette session
1. ✅ **Analysé les 3 branches**:
   - `main`: Contracts + Simple backend (oracle.js, indexer.js)
   - `frontend`: React + Vite + RainbowKit + Wagmi (6 composants)
   - `back`: Backend professionnel avec Express, SQLite, ABIs, Winston

2. ✅ **Réorganisé la structure du projet**:
   - Créé dossier `blockchain/` pour Hardhat/scripts/tests/deployments
   - Déplacé `scripts/` → `blockchain/scripts/`
   - Déplacé `test/SmartContracts.test.js` → `blockchain/test/`
   - Déplacé `deployments/` → `blockchain/deployments/`
   - Déplacé `hardhat.config.js` → `blockchain/hardhat.config.js`
   - Créé `blockchain/package.json` avec dépendances Hardhat

3. ✅ **Mis à jour les chemins**:
   - `blockchain/hardhat.config.js`: sources="../contracts", .env="../.env"
   - `blockchain/scripts/deploy-direct.js`: dotenv path ajusté
   - `blockchain/scripts/setup-liquidity-direct.js`: dotenv path ajusté

4. ✅ **Mis à jour la documentation**:
   - `.gitignore`: ajouté blockchain/, frontend/ paths
   - `README.md`: nouvelle structure documentée
   - Commandes mises à jour (cd blockchain && npm run...)

5. ⚠️ **Problème rencontré et résolu**:
   - Hardhat 3.x ne compile pas avec sources="../contracts" (erreur HHE900)
   - ✅ **Solution appliquée**: Garder `hardhat.config.js` à la racine, pointer artifacts/cache vers blockchain/
   - ✅ Compilation fonctionne: `npx hardhat compile` (7 contrats compilés)

### Structure finale du projet
```
Blockchain/
├── contracts/              # Smart contracts Solidity
├── blockchain/             # Scripts blockchain + artifacts
│   ├── scripts/           # deploy-direct.js, setup-liquidity-direct.js
│   ├── test/              # SmartContracts.test.js
│   ├── deployments/       # amoy-*.json
│   ├── artifacts/         # ABIs compilés (généré)
│   ├── cache/             # Cache Hardhat (généré)
│   └── package.json       # Hardhat dependencies
├── backend/                # Services (oracle + indexer simple)
├── frontend/               # (à merger depuis branche)
├── hardhat.config.js       # Config Hardhat (à la racine!)
├── .env
└── README.md
```

### Prochaine session - IMPORTANT
1. ✅ ~~Fixer compilation Hardhat~~ - RÉSOLU!

2. **Commit la réorganisation**:
   ```bash
   git add .
   git commit -m "Reorganize project structure for multi-service architecture"
   ```

3. **Merger les branches**:
   - Merger `frontend` branch (React app)
   - Merger `back` branch (backend professionnel)
   - Résoudre conflits (backend/package.json)

---

## 📅 Session du 2025-10-17 (Initiale)

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

### Déploiement Amoy (NOUVELLE STRUCTURE)
```bash
cd blockchain
npm run deploy:amoy
# ou: npx hardhat run scripts/deploy-direct.js --network amoy
```

### Setup Pool DEX
```bash
cd blockchain
npm run setup-liquidity
```

### Backend Services
```bash
cd backend
npm run oracle    # Port 3001
npm run indexer   # Port 3002
npm run dev       # Les deux en parallèle
```

### Adresses importantes
- **DonaSwap Router** (Amoy): `0x6E682B51F8bb67294B522b75a1E79dDd4502cc94`
- **DonaSwap Factory**: `0x8e5dff1c121F661971d02950698f8c5EFc3DfA78`
- **RES/WMATIC Pair**: `0x34b250940c88764c72Ab5DE28AEA9C6DfFaa1c8C`
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
3. ⏳ Token Trading sur DEX (infrastructure créée)
4. ✅ Real-time indexer (simple version créée)
5. ✅ Oracle pour pricing (simple version créée)
6. ⏳ Frontend (existe sur branche `frontend`)
7. ⏳ Backend/API (existe sur branche `back`)

### Délai
- 5 semaines (~120-150h total)
- Équipe: Victor (lead blockchain), Bastien (frontend), Sean (backend/indexer), Theo (DevOps)
