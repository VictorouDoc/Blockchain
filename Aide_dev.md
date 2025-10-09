# 🚀 Guide de Déploiement - Tokenized Asset Platform

## ✅ Ce qui a été fait

### 1. Smart Contracts (100% - Victor)
- ✅ `KYCRegistry.sol` - Gestion whitelist/blacklist
- ✅ `RealEstateToken.sol` - ERC-20 avec KYC
- ✅ `PropertyNFT.sol` - ERC-721 avec KYC
- ✅ Interfaces Uniswap V2

### 2. Scripts de déploiement (100% - Victor)
- ✅ `scripts/deploy.js` - Déploie tous les contrats
- ✅ `scripts/setup-liquidity.js` - Crée pool DEX + liquidité

### 3. Documentation (100% - Victor)
- ✅ `README.md` - Guide principal
- ✅ `docs/DEX_INTEGRATION.md` - Guide complet DEX
- ✅ Ce fichier (guide de déploiement)

---

## 🎯 Prochaines étapes POUR TOI (Victor)

### Option 1: Déployer sur testnet maintenant
### Option 2: Écrire les tests d'abord (recommandé)

---

## 📋 Pour déployer sur Polygon Amoy

### Étape 1: Créer un compte MetaMask (si pas encore fait)

**OUI, tu dois créer un compte MetaMask !** Voici comment :

1. **Installer MetaMask**:
   - Va sur https://metamask.io/
   - Télécharge l'extension Chrome/Firefox
   - Crée un nouveau wallet
   - **⚠️ SAUVEGARDE ta seed phrase dans un endroit sûr !**

2. **Ajouter Polygon Amoy Testnet**:
   - Ouvre MetaMask
   - Clique sur le menu réseau en haut
   - "Add Network" → "Add network manually"
   - Entre ces infos:
     ```
     Network Name: Polygon Amoy Testnet
     RPC URL: https://rpc-amoy.polygon.technology
     Chain ID: 80002
     Currency Symbol: POL
     Block Explorer: https://amoy.polygonscan.com/
     ```

3. **Obtenir des tokens de test** (gratuits):
   - Va sur https://faucet.polygon.technology/
   - Connecte ton wallet MetaMask
   - Demande des POL tokens (pour payer le gas)
   - Attends ~1 minute

### Étape 2: Configurer le .env

Crée un fichier `.env` à la racine du projet :

```bash
# Dans ton terminal (Git Bash)
touch .env
```

Ouvre `.env` et ajoute :

```bash
# Ta clé privée MetaMask (⚠️ JAMAIS la partager ou commit !)
PRIVATE_KEY=ta_cle_privee_ici

# RPC URL Polygon Amoy
AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# API Key Polygonscan (optionnel, pour vérifier les contrats)
POLYGONSCAN_API_KEY=ton_api_key_polygonscan
```

**Comment obtenir ta clé privée MetaMask ?**
1. Ouvre MetaMask
2. Clique sur les 3 points → Account details
3. "Export Private Key"
4. Entre ton mot de passe
5. **⚠️ COPIE la clé et colle dans .env**
6. **⚠️ VÉRIFIE que .env est dans .gitignore !**

**API Key Polygonscan (optionnel mais recommandé):**
1. Va sur https://polygonscan.com/
2. Crée un compte gratuit
3. API Keys → Create New API Key
4. Copie dans .env

### Étape 3: Déployer les contrats

```bash
# 1. Vérifier que tout compile
npx hardhat compile

# 2. Déployer sur Amoy
npx hardhat run scripts/deploy.js --network amoy

# Attends ~2-3 minutes
# Tu verras les adresses des contrats déployés
```

### Étape 4: Setup le pool Uniswap

```bash
npx hardhat run scripts/setup-liquidity.js --network amoy

# Ceci va:
# - Créer une paire RES/WMATIC sur QuickSwap
# - Whitelister le router et la paire
# - Ajouter 100 RES + 0.1 MATIC de liquidité
```

### Étape 5: Noter les adresses

Les adresses sont sauvegardées dans :
- `deployments/amoy-<timestamp>.json` - Contrats principaux
- `deployments/pool-amoy-<timestamp>.json` - Info du pool

**⚠️ SAUVEGARDE CES ADRESSES** pour les donner à Bastien (frontend) et Sean (backend)

---

## 🧪 Option recommandée: Écrire les tests d'abord

**Pourquoi ?**
- Ça valide que tes contrats marchent bien
- Le prof va tester ton code
- Ça aide à trouver des bugs avant le déploiement
- Ça donne confiance pour la démo

**Tests à écrire** (je peux t'aider):
1. `test/KYCRegistry.test.js` - Test whitelist/blacklist
2. `test/RealEstateToken.test.js` - Test transfers avec KYC
3. `test/PropertyNFT.test.js` - Test minting/transfers NFT
4. `test/DEX.test.js` - Test swap avec KYC

Veux-tu que je crée ces tests maintenant ?

---

## 🌐 Après déploiement

### Vérifier sur Polygonscan

1. Va sur https://amoy.polygonscan.com/
2. Cherche l'adresse de ton contrat
3. Tu devrais voir:
   - Le code source (si vérification réussie)
   - Les transactions
   - Les événements

### Tester un swap manuel (Hardhat console)

```bash
npx hardhat console --network amoy
```

Puis dans la console :

```javascript
// Charger les contrats
const [signer] = await ethers.getSigners();
const token = await ethers.getContractAt("RealEstateToken", "ADRESSE_TOKEN");
const kyc = await ethers.getContractAt("KYCRegistry", "ADRESSE_KYC");

// Vérifier ton solde
const balance = await token.balanceOf(signer.address);
console.log("Balance:", ethers.formatEther(balance), "RES");

// Vérifier que tu es whitelisté
const isAuthorized = await kyc.isAuthorized(signer.address);
console.log("Whitelisté ?", isAuthorized);
```

---

## 📤 Donner les infos à l'équipe

### Pour Bastien (Frontend):

Donne-lui :
- ✅ Adresse `RealEstateToken`
- ✅ Adresse `PropertyNFT`
- ✅ Adresse `KYCRegistry`
- ✅ Adresse du Router QuickSwap: `0x8954AfA98594b838bda56FE4C12a09D7739D179b`
- ✅ Adresse de la paire RES/WMATIC (dans `pool-amoy-<timestamp>.json`)
- ✅ Les ABIs (dans `artifacts/contracts/`)

Il en aura besoin pour connecter le frontend aux contrats.

### Pour Sean (Backend):

Donne-lui :
- ✅ Toutes les adresses ci-dessus
- ✅ Les événements à écouter :
  - `Transfer` (RealEstateToken et PropertyNFT)
  - `AddressWhitelisted` (KYCRegistry)
  - `Swap` (Uniswap Pair)
  - `PropertyMinted` (PropertyNFT)

Il en aura besoin pour l'indexer.

---

## 🐛 Dépannage

### Erreur: "insufficient funds"
→ Retourne sur le faucet pour avoir plus de POL

### Erreur: "nonce too high"
→ Réinitialise MetaMask: Settings → Advanced → Reset Account

### Erreur: "contract not deployed"
→ Vérifie que tu as bien lancé `deploy.js` avant `setup-liquidity.js`

### Le script setup-liquidity.js ne marche pas en local
→ C'est normal ! Il faut être sur Amoy testnet. En local, il faudrait déployer tout Uniswap V2 (complexe).

---

## ✅ Checklist finale

Avant de passer à autre chose :

- [ ] Contrats compilent sans erreur
- [ ] Tests écrits et passent (ou à faire)
- [ ] Déployé sur Amoy
- [ ] Pool créé et liquidité ajoutée
- [ ] Adresses sauvegardées et partagées avec l'équipe
- [ ] Contrats vérifiés sur Polygonscan
- [ ] README.md à jour
- [ ] `.env` dans `.gitignore` (⚠️ CRITIQUE)

---

## 📞 Besoin d'aide ?

**Je peux t'aider avec** :
1. ✅ Écrire les tests Hardhat
2. ✅ Débugger les erreurs de déploiement
3. ✅ Créer un script de test du swap
4. ✅ Optimiser le gas
5. ✅ Ajouter des fonctionnalités

**Prochaine étape recommandée** : Écris les tests ! Ça te prendra ~4-6h mais c'est indispensable.

---

**Créé par : Claude Code + Victor**
*Date : 2025-01-XX*
