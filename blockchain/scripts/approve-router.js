// Approve Router to spend RES tokens
// This is a workaround if the frontend approve button doesn't work
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function symbol() external view returns (string)',
];

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n🔐 Approve Router Uniswap à dépenser RES tokens\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
  );

  // Get private key
  let privateKey = process.env.PRIVATE_KEY;

  // If no private key in env, ask for it
  if (!privateKey) {
    console.log('⚠️  Aucune PRIVATE_KEY trouvée dans .env');
    privateKey = await askQuestion('Entre ta clé privée (sera utilisée une seule fois): ');

    if (!privateKey || !privateKey.startsWith('0x')) {
      console.error('❌ Clé privée invalide');
      process.exit(1);
    }
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log('📍 Ton adresse:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance ETH:', ethers.formatEther(balance), 'ETH\n');

  if (parseFloat(ethers.formatEther(balance)) < 0.001) {
    console.error('❌ Pas assez d\'ETH pour payer les gas fees (besoin ~0.001 ETH)');
    process.exit(1);
  }

  // Load deployment
  const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'deployments', 'sepolia-latest.json'), 'utf8')
  );

  const RES_ADDRESS = deployment.contracts.RealEstateToken;
  const ROUTER_ADDRESS = deployment.uniswapV2.router;

  console.log('📍 Contrats:');
  console.log('   RES Token:', RES_ADDRESS);
  console.log('   Uniswap Router:', ROUTER_ADDRESS);
  console.log('');

  // Connect to RES token
  const res = new ethers.Contract(RES_ADDRESS, ERC20_ABI, wallet);

  // Check current state
  console.log('1️⃣  Vérification état actuel...\n');

  const [resBalance, currentAllowance, symbol] = await Promise.all([
    res.balanceOf(wallet.address),
    res.allowance(wallet.address, ROUTER_ADDRESS),
    res.symbol(),
  ]);

  const resBalanceFormatted = ethers.formatUnits(resBalance, 18);
  const currentAllowanceFormatted = ethers.formatUnits(currentAllowance, 18);

  console.log(`   Balance ${symbol}:`.padEnd(30), resBalanceFormatted, symbol);
  console.log(`   Allowance actuelle:`.padEnd(30), currentAllowanceFormatted, symbol);
  console.log('');

  if (parseFloat(resBalanceFormatted) === 0) {
    console.error('❌ Tu n\'as pas de RES tokens à approuver!');
    process.exit(1);
  }

  // Ask user what amount to approve
  console.log('2️⃣  Quel montant veux-tu approuver?\n');
  console.log('   Options:');
  console.log('   1. Montant illimité (recommandé) - plus besoin de re-approve');
  console.log(`   2. Ta balance complète (${resBalanceFormatted} ${symbol})`);
  console.log('   3. Montant personnalisé\n');

  const choice = await askQuestion('Choix (1/2/3): ');

  let amountToApprove;

  if (choice === '1') {
    // Max uint256
    amountToApprove = ethers.MaxUint256;
    console.log('✅ Montant illimité sélectionné');
  } else if (choice === '2') {
    amountToApprove = resBalance;
    console.log(`✅ Balance complète sélectionnée: ${resBalanceFormatted} ${symbol}`);
  } else if (choice === '3') {
    const customAmount = await askQuestion(`Montant en ${symbol}: `);
    amountToApprove = ethers.parseUnits(customAmount, 18);
    console.log(`✅ Montant personnalisé: ${customAmount} ${symbol}`);
  } else {
    console.error('❌ Choix invalide');
    process.exit(1);
  }

  console.log('\n3️⃣  Envoi de la transaction approve...\n');

  try {
    const tx = await res.approve(ROUTER_ADDRESS, amountToApprove);
    console.log('   📤 TX envoyée:', tx.hash);
    console.log('   ⏳ Attente de confirmation...');

    const receipt = await tx.wait();
    console.log('   ✅ TX confirmée!\n');

    // Verify new allowance
    const newAllowance = await res.allowance(wallet.address, ROUTER_ADDRESS);
    const newAllowanceFormatted = ethers.formatUnits(newAllowance, 18);

    console.log('═'.repeat(70));
    console.log('🎉 APPROVE RÉUSSI!');
    console.log('═'.repeat(70));
    console.log(`Nouvelle allowance: ${newAllowanceFormatted} ${symbol}`);
    console.log(`Transaction: https://sepolia.etherscan.io/tx/${tx.hash}`);
    console.log('═'.repeat(70));
    console.log('\n✅ Tu peux maintenant swap RES -> ETH dans le frontend!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'approve:');
    console.error(error.message);
    process.exit(1);
  }
}

main().catch(console.error);
