// Create RES/WETH pair on Uniswap V2 Factory (Sepolia)
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Uniswap V2 Factory ABI (minimal)
const FACTORY_ABI = [
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
];

async function main() {
  console.log('🏭 Création du pair RES/WETH sur Uniswap V2\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
  );

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log('Wallet:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Balance ETH:', ethers.formatEther(balance), 'ETH\n');

  // Load deployment
  const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'deployments', 'sepolia-latest.json'), 'utf8')
  );

  const RES_ADDRESS = deployment.contracts.RealEstateToken;
  const WETH_ADDRESS = deployment.uniswapV2.weth;
  const FACTORY_ADDRESS = deployment.uniswapV2.factory;

  console.log('📍 Contrats:');
  console.log('  RES Token:', RES_ADDRESS);
  console.log('  WETH:', WETH_ADDRESS);
  console.log('  Factory:', FACTORY_ADDRESS, '\n');

  // Connect to factory
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);

  // Check if pair already exists
  console.log('1️⃣  Vérification si le pair existe déjà...');
  try {
    const existingPair = await factory.getPair(RES_ADDRESS, WETH_ADDRESS);

    if (existingPair !== '0x0000000000000000000000000000000000000000') {
      console.log('   ✅ Le pair existe déjà!');
      console.log('   Adresse:', existingPair, '\n');

      console.log('⚙️  Ajouter dans frontend/.env:');
      console.log(`VITE_RES_WETH_PAIR=${existingPair}\n`);
      return;
    }
  } catch (err) {
    console.log('   ⚠️  Le pair n\'existe pas encore\n');
  }

  // Create the pair
  console.log('2️⃣  Création du pair RES/WETH...');
  const createTx = await factory.createPair(RES_ADDRESS, WETH_ADDRESS);
  console.log('   TX:', createTx.hash);
  const receipt = await createTx.wait();
  console.log('   ✅ Pair créé!\n');

  // Get pair address from event
  const pairCreatedEvent = receipt.logs
    .map(log => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find(event => event && event.name === 'PairCreated');

  if (pairCreatedEvent) {
    const pairAddress = pairCreatedEvent.args.pair;
    console.log('🎉 Succès!');
    console.log('════════════════════════════════════════════════════════════');
    console.log('Pair RES/WETH:', pairAddress);
    console.log('Token0:', pairCreatedEvent.args.token0);
    console.log('Token1:', pairCreatedEvent.args.token1);
    console.log('Voir sur Etherscan:', `https://sepolia.etherscan.io/address/${pairAddress}`);
    console.log('════════════════════════════════════════════════════════════\n');

    console.log('⚙️  Ajouter dans frontend/.env:');
    console.log(`VITE_RES_WETH_PAIR=${pairAddress}\n`);
  } else {
    console.log('⚠️  Événement PairCreated non trouvé dans les logs');

    // Try to get it via getPair as fallback
    const pairAddress = await factory.getPair(RES_ADDRESS, WETH_ADDRESS);
    console.log('Pair address (via getPair):', pairAddress, '\n');

    console.log('⚙️  Ajouter dans frontend/.env:');
    console.log(`VITE_RES_WETH_PAIR=${pairAddress}\n`);
  }
}

main().catch(console.error);
