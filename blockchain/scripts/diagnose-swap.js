// Diagnostic complet pour comprendre pourquoi un swap RES -> ETH échoue
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ABIs minimaux
const KYC_ABI = [
  'function isWhitelisted(address account) external view returns (bool)',
  'function isBlacklisted(address account) external view returns (bool)',
  'function isAuthorized(address account) external view returns (bool)',
];

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

async function askForAddress() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Adresse Ethereum à diagnostiquer: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function printSection(title) {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function printStatus(label, status, details = '') {
  const icon = status ? '✅' : '❌';
  console.log(`${icon} ${label.padEnd(40)} ${details}`);
}

async function main() {
  console.log('\n🔍 Diagnostic Swap RES -> ETH\n');

  // Get address from command line or prompt
  let userAddress = process.argv[2];

  if (!userAddress) {
    userAddress = await askForAddress();
  }

  if (!userAddress || !ethers.isAddress(userAddress)) {
    console.error('❌ Adresse invalide');
    process.exit(1);
  }

  console.log(`\n👤 Adresse testée: ${userAddress}\n`);

  // Setup provider
  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
  );

  // Load deployment
  const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'deployments', 'sepolia-latest.json'), 'utf8')
  );

  const KYC_ADDRESS = deployment.contracts.KYCRegistry;
  const RES_ADDRESS = deployment.contracts.RealEstateToken;
  const ROUTER_ADDRESS = deployment.uniswapV2.router;
  const PAIR_ADDRESS = deployment.uniswapV2.pair;

  console.log('📍 Contrats:');
  console.log(`   KYCRegistry: ${KYC_ADDRESS}`);
  console.log(`   RealEstateToken: ${RES_ADDRESS}`);
  console.log(`   Uniswap Router: ${ROUTER_ADDRESS}`);
  console.log(`   RES/WETH Pair: ${PAIR_ADDRESS}`);

  // Connect to contracts
  const kyc = new ethers.Contract(KYC_ADDRESS, KYC_ABI, provider);
  const res = new ethers.Contract(RES_ADDRESS, ERC20_ABI, provider);
  const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, provider);

  // ========================================
  // 1. CHECK KYC STATUS
  // ========================================
  printSection('1️⃣  KYC STATUS');

  const isWhitelisted = await kyc.isWhitelisted(userAddress);
  const isBlacklisted = await kyc.isBlacklisted(userAddress);
  const isAuthorized = await kyc.isAuthorized(userAddress);

  printStatus('Whitelisté', isWhitelisted);
  printStatus('Blacklisté (doit être false)', !isBlacklisted);
  printStatus('Autorisé (final)', isAuthorized);

  if (!isAuthorized) {
    console.log('\n⚠️  PROBLÈME TROUVÉ: Utilisateur pas autorisé!');
    if (!isWhitelisted) {
      console.log('   → Solution: Whitelist l\'adresse avec:');
      console.log(`      node blockchain/scripts/whitelist-address.js ${userAddress}`);
    }
    if (isBlacklisted) {
      console.log('   → Solution: Retirer de la blacklist (contacter admin)');
    }
  }

  // ========================================
  // 2. CHECK BALANCES
  // ========================================
  printSection('2️⃣  BALANCES');

  const resBalance = await res.balanceOf(userAddress);
  const ethBalance = await provider.getBalance(userAddress);

  const resBalanceFormatted = ethers.formatUnits(resBalance, 18);
  const ethBalanceFormatted = ethers.formatEther(ethBalance);

  printStatus('Balance RES', parseFloat(resBalanceFormatted) > 0, `${resBalanceFormatted} RES`);
  printStatus('Balance ETH (pour gas)', parseFloat(ethBalanceFormatted) > 0.001, `${ethBalanceFormatted} ETH`);

  if (parseFloat(resBalanceFormatted) === 0) {
    console.log('\n⚠️  PROBLÈME TROUVÉ: Aucun token RES!');
    console.log('   → Solution: Recevoir des RES tokens d\'une adresse whitelistée');
  }

  if (parseFloat(ethBalanceFormatted) < 0.001) {
    console.log('\n⚠️  PROBLÈME TROUVÉ: Pas assez d\'ETH pour les gas fees!');
    console.log('   → Solution: Obtenir du Sepolia ETH depuis faucet');
    console.log('      https://sepoliafaucet.com/');
  }

  // ========================================
  // 3. CHECK ROUTER ALLOWANCE
  // ========================================
  printSection('3️⃣  ROUTER ALLOWANCE');

  const allowance = await res.allowance(userAddress, ROUTER_ADDRESS);
  const allowanceFormatted = ethers.formatUnits(allowance, 18);
  const hasAllowance = parseFloat(allowanceFormatted) > 0;

  printStatus('Allowance Router', hasAllowance, `${allowanceFormatted} RES`);

  if (!hasAllowance) {
    console.log('\n⚠️  ATTENTION: Aucune allowance pour le Router!');
    console.log('   → Solution: Utiliser le bouton "Approve RES" dans l\'interface avant de swap');
    console.log('   → Le frontend devrait afficher ce bouton automatiquement');
  }

  // ========================================
  // 4. CHECK ROUTER & PAIR KYC
  // ========================================
  printSection('4️⃣  ROUTER & PAIR KYC');

  const routerWhitelisted = await kyc.isWhitelisted(ROUTER_ADDRESS);
  const pairWhitelisted = await kyc.isWhitelisted(PAIR_ADDRESS);

  printStatus('Router whitelisté', routerWhitelisted);
  printStatus('Pair whitelisté', pairWhitelisted);

  if (!routerWhitelisted || !pairWhitelisted) {
    console.log('\n⚠️  PROBLÈME TROUVÉ: Router ou Pair pas whitelisté!');
    console.log('   → Solution: Whitelist avec:');
    console.log('      node blockchain/scripts/whitelist-router.js');
  }

  // ========================================
  // 5. CHECK POOL LIQUIDITY
  // ========================================
  printSection('5️⃣  POOL LIQUIDITY');

  const reserves = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();

  // Determine which reserve is RES and which is WETH
  const resIsToken0 = token0.toLowerCase() === RES_ADDRESS.toLowerCase();
  const resReserve = resIsToken0 ? reserves[0] : reserves[1];
  const wethReserve = resIsToken0 ? reserves[1] : reserves[0];

  const resReserveFormatted = ethers.formatUnits(resReserve, 18);
  const wethReserveFormatted = ethers.formatUnits(wethReserve, 18);

  printStatus('Réserve RES', parseFloat(resReserveFormatted) > 0, `${resReserveFormatted} RES`);
  printStatus('Réserve WETH', parseFloat(wethReserveFormatted) > 0, `${wethReserveFormatted} WETH`);

  if (parseFloat(resReserveFormatted) === 0 || parseFloat(wethReserveFormatted) === 0) {
    console.log('\n⚠️  PROBLÈME TROUVÉ: Pool sans liquidité!');
    console.log('   → Solution: Ajouter liquidité avec:');
    console.log('      node blockchain/scripts/add-liquidity-sepolia.js');
  }

  // ========================================
  // SUMMARY
  // ========================================
  printSection('📊 RÉSUMÉ');

  const checks = [
    { name: 'Utilisateur autorisé (KYC)', status: isAuthorized },
    { name: 'Balance RES > 0', status: parseFloat(resBalanceFormatted) > 0 },
    { name: 'Balance ETH suffisante', status: parseFloat(ethBalanceFormatted) > 0.001 },
    { name: 'Allowance Router configurée', status: hasAllowance },
    { name: 'Router whitelisté', status: routerWhitelisted },
    { name: 'Pair whitelisté', status: pairWhitelisted },
    { name: 'Liquidité pool > 0', status: parseFloat(resReserveFormatted) > 0 && parseFloat(wethReserveFormatted) > 0 },
  ];

  const passed = checks.filter(c => c.status).length;
  const total = checks.length;

  console.log(`\n✅ Checks passés: ${passed}/${total}\n`);

  if (passed === total) {
    console.log('🎉 Tous les checks sont OK! Le swap RES -> ETH devrait fonctionner.\n');
    console.log('Si le swap échoue quand même, vérifier:');
    console.log('  - Le montant à swap (pas trop élevé par rapport aux réserves)');
    console.log('  - Les gas fees (augmenter la limite de gas)');
    console.log('  - La console du navigateur pour voir l\'erreur exacte');
  } else {
    console.log('❌ Certains checks ont échoué. Voir les solutions ci-dessus.\n');

    const failedChecks = checks.filter(c => !c.status);
    console.log('Checks échoués:');
    failedChecks.forEach(c => {
      console.log(`  ❌ ${c.name}`);
    });
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

main().catch(console.error);
