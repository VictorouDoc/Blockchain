// Transfer RES tokens to another address (test KYC & balance changes)
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  console.log('💸 Transfer de tokens RES\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
  );

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log('From (ton wallet):', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Balance ETH:', ethers.formatEther(balance), 'ETH\n');

  // Load deployment
  const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'deployments', 'sepolia-latest.json'), 'utf8')
  );

  const RES_ADDRESS = deployment.contracts.RealEstateToken;
  const resToken = new ethers.Contract(RES_ADDRESS, ERC20_ABI, wallet);

  // Check RES balance
  const resBalance = await resToken.balanceOf(wallet.address);
  console.log('📍 Ton adresse RES:', RES_ADDRESS);
  console.log('Balance RES:', ethers.formatEther(resBalance), 'RES\n');

  if (resBalance === 0n) {
    console.log('❌ Tu n\'as pas de tokens RES à transférer.');
    return;
  }

  // Ask for recipient address
  const toAddress = await askQuestion('Adresse du destinataire (0x...): ');

  if (!ethers.isAddress(toAddress)) {
    console.log('❌ Adresse invalide');
    return;
  }

  // Ask for amount
  const amountStr = await askQuestion('Montant à transférer (en RES): ');
  const amount = ethers.parseEther(amountStr);

  if (amount > resBalance) {
    console.log(`❌ Balance insuffisante (tu as ${ethers.formatEther(resBalance)} RES)`);
    return;
  }

  console.log('\n📋 Résumé du transfer:');
  console.log('  De:', wallet.address);
  console.log('  Vers:', toAddress);
  console.log('  Montant:', ethers.formatEther(amount), 'RES\n');

  const confirm = await askQuestion('Confirmer le transfer ? (y/n): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Transfer annulé');
    return;
  }

  // Execute transfer
  console.log('\n💸 Transfer en cours...');
  const tx = await resToken.transfer(toAddress, amount);
  console.log('TX Hash:', tx.hash);
  console.log('Attente de confirmation...');

  const receipt = await tx.wait();
  console.log('✅ Transfer confirmé!\n');

  // Check new balances
  const newBalanceFrom = await resToken.balanceOf(wallet.address);
  const newBalanceTo = await resToken.balanceOf(toAddress);

  console.log('🎉 Succès!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Nouvelle balance (from):', ethers.formatEther(newBalanceFrom), 'RES');
  console.log('Nouvelle balance (to):', ethers.formatEther(newBalanceTo), 'RES');
  console.log('Voir sur Etherscan:', `https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log('════════════════════════════════════════════════════════════\n');

  console.log('✅ Recharge le frontend pour voir la nouvelle balance!');
}

main().catch(console.error);
