// Whitelist Uniswap Router in KYCRegistry
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// KYCRegistry ABI (minimal)
const KYC_ABI = [
  'function whitelist(address account) external',
  'function isWhitelisted(address account) external view returns (bool)',
  'event Whitelisted(address indexed account)',
];

async function main() {
  console.log('✅ Whitelist Uniswap Router dans KYCRegistry\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
  );

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log('Deployer (owner):', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Balance ETH:', ethers.formatEther(balance), 'ETH\n');

  // Load deployment
  const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'deployments', 'sepolia-latest.json'), 'utf8')
  );

  const KYC_ADDRESS = deployment.contracts.KYCRegistry;
  const ROUTER_ADDRESS = deployment.uniswapV2.router;
  const PAIR_ADDRESS = '0x8DB5219a28376ff2bEd277459D6845EcF115f813'; // RES/WETH Pair

  console.log('📍 Contrats:');
  console.log('  KYCRegistry:', KYC_ADDRESS);
  console.log('  Router:', ROUTER_ADDRESS);
  console.log('  Pair RES/WETH:', PAIR_ADDRESS);
  console.log('');

  // Connect to KYCRegistry
  const kyc = new ethers.Contract(KYC_ADDRESS, KYC_ABI, wallet);

  // Check if Router is already whitelisted
  console.log('1️⃣  Vérification whitelist du Router...');
  const isRouterWhitelisted = await kyc.isWhitelisted(ROUTER_ADDRESS);

  if (isRouterWhitelisted) {
    console.log('   ✅ Router déjà whitelisté!\n');
  } else {
    console.log('   ⚠️  Router pas encore whitelisté\n');
    console.log('2️⃣  Whitelist du Router...');
    const tx = await kyc.whitelist(ROUTER_ADDRESS);
    console.log('   TX:', tx.hash);
    await tx.wait();
    console.log('   ✅ Router whitelisté!\n');
  }

  // Also whitelist the pair if provided
  if (PAIR_ADDRESS) {
    console.log('3️⃣  Vérification whitelist du Pair...');
    const isPairWhitelisted = await kyc.isWhitelisted(PAIR_ADDRESS);

    if (isPairWhitelisted) {
      console.log('   ✅ Pair déjà whitelisté!\n');
    } else {
      console.log('   ⚠️  Pair pas encore whitelisté\n');
      console.log('4️⃣  Whitelist du Pair...');
      const tx = await kyc.whitelist(PAIR_ADDRESS);
      console.log('   TX:', tx.hash);
      await tx.wait();
      console.log('   ✅ Pair whitelisté!\n');
    }
  }

  console.log('🎉 Succès!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Router Uniswap whitelisté:', ROUTER_ADDRESS);
  if (PAIR_ADDRESS) {
    console.log('Pair RES/WETH whitelisté:', PAIR_ADDRESS);
  }
  console.log('════════════════════════════════════════════════════════════\n');

  console.log('✅ Tu peux maintenant ajouter de la liquidité!');
  console.log('   node scripts/add-liquidity-sepolia.js\n');
}

main().catch(console.error);
