// Add liquidity to Uniswap V2 pool (RES/WETH) on Sepolia
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Uniswap V2 Router ABI (minimal)
const ROUTER_ABI = [
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function factory() external view returns (address)',
];

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

// Pair ABI (minimal)
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

async function main() {
  console.log('💧 Ajout de liquidité sur Uniswap V2 (Sepolia)\n');

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
  const ROUTER_ADDRESS = deployment.uniswapV2.router;
  const WETH_ADDRESS = deployment.uniswapV2.weth;

  console.log('📍 Contrats:');
  console.log('  RES Token:', RES_ADDRESS);
  console.log('  Uniswap Router:', ROUTER_ADDRESS);
  console.log('  WETH:', WETH_ADDRESS, '\n');

  // Connect to contracts
  const resToken = new ethers.Contract(RES_ADDRESS, ERC20_ABI, wallet);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);

  // Check RES balance
  const resBalance = await resToken.balanceOf(wallet.address);
  console.log('Balance RES:', ethers.formatEther(resBalance), 'RES\n');

  if (resBalance === 0n) {
    console.log('❌ Tu n\'as pas de tokens RES. Déploie RealEstateToken d\'abord.');
    return;
  }

  // Get pair address and check if it exists
  const FACTORY_ABI = ['function getPair(address tokenA, address tokenB) external view returns (address pair)'];
  const FACTORY_ADDRESS = deployment.uniswapV2.factory;
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  const pairAddress = await factory.getPair(RES_ADDRESS, WETH_ADDRESS);

  console.log('Pair Address:', pairAddress, '\n');

  // If pair exists, get current reserves to calculate proper ratio
  let RES_AMOUNT = ethers.parseEther('10'); // Default: 10 RES tokens
  let ETH_AMOUNT = ethers.parseEther('0.001'); // Default: 0.001 ETH

  if (pairAddress !== ethers.ZeroAddress) {
    console.log('📊 Pool existe déjà, calcul du ratio optimal...\n');
    
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();
    
    // Determine which reserve is RES and which is WETH
    const isToken0RES = token0.toLowerCase() === RES_ADDRESS.toLowerCase();
    const resReserve = isToken0RES ? reserve0 : reserve1;
    const wethReserve = isToken0RES ? reserve1 : reserve0;

    console.log('Réserves actuelles du pool:');
    console.log('  RES:', ethers.formatEther(resReserve), 'RES');
    console.log('  WETH:', ethers.formatEther(wethReserve), 'WETH');
    
    // Use 80% of available ETH (keep some for gas)
    const maxEthToUse = (balance * 80n) / 100n;
    ETH_AMOUNT = maxEthToUse;
    
    // Calculate RES amount based on available ETH
    // ratio = resReserve / wethReserve
    // RES_AMOUNT = ETH_AMOUNT * ratio
    RES_AMOUNT = (ETH_AMOUNT * resReserve) / wethReserve;
    
    console.log('\nRatio optimal calculé (basé sur ETH disponible):');
    console.log('  Ajouter:', ethers.formatEther(RES_AMOUNT), 'RES');
    console.log('  Ajouter:', ethers.formatEther(ETH_AMOUNT), 'ETH\n');
  } else {
    console.log('🆕 Nouveau pool, ratio libre\n');
  }

  console.log('💧 Liquidité à ajouter:');
  console.log('  RES:', ethers.formatEther(RES_AMOUNT), 'RES');
  console.log('  ETH:', ethers.formatEther(ETH_AMOUNT), 'ETH\n');

  if (resBalance < RES_AMOUNT) {
    console.log(`⚠️  Tu n'as que ${ethers.formatEther(resBalance)} RES (besoin de 100 RES)`);
    console.log('Ajustement automatique à ta balance...\n');
    RES_AMOUNT = resBalance;
  }

  if (balance < ETH_AMOUNT) {
    console.log(`❌ Balance ETH insuffisante (besoin de ${ethers.formatEther(ETH_AMOUNT)} ETH)`);
    return;
  }

  // Step 1: Approve Router to spend RES
  console.log('1️⃣  Approbation du Router pour dépenser RES...');
  const allowance = await resToken.allowance(wallet.address, ROUTER_ADDRESS);

  if (allowance < RES_AMOUNT) {
    const approveTx = await resToken.approve(ROUTER_ADDRESS, RES_AMOUNT);
    console.log('   TX:', approveTx.hash);
    await approveTx.wait();
    console.log('   ✅ Approbation confirmée\n');
  } else {
    console.log('   ✅ Déjà approuvé\n');
  }

  // Step 2: Add liquidity
  console.log('2️⃣  Ajout de liquidité au pool RES/WETH...');

  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes

  const liquidityTx = await router.addLiquidityETH(
    RES_ADDRESS,
    RES_AMOUNT,
    RES_AMOUNT * 95n / 100n, // 5% slippage
    ETH_AMOUNT * 95n / 100n, // 5% slippage
    wallet.address,
    deadline,
    { value: ETH_AMOUNT }
  );

  console.log('   TX:', liquidityTx.hash);
  const receipt = await liquidityTx.wait();
  console.log('   ✅ Liquidité ajoutée!\n');

  console.log('🎉 Succès!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Pair RES/WETH:', pairAddress);
  console.log('Voir sur Sepolia Etherscan:');
  console.log(`https://sepolia.etherscan.io/address/${pairAddress}`);
  console.log(`Transaction liquidité: https://sepolia.etherscan.io/tx/${liquidityTx.hash}`);
  console.log('════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
