// Check DEX pair liquidity and reserves
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

async function main() {
  const rpcUrl = process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Load deployment data
  const deploymentPath = join(__dirname, '../../deployments/amoy-latest.json');
  const deployment = JSON.parse(readFileSync(deploymentPath, 'utf-8'));

  const pairAddress = deployment.dex?.pair || '0x34b250940c88764c72Ab5DE28AEA9C6DfFaa1c8C';
  const routerAddress = deployment.dex?.router || '0x6E682B51F8bb67294B522b75a1E79dDd4502cc94';
  const resAddress = deployment.contracts.RealEstateToken;

  console.log('🔍 Vérification liquidité DEX (DonaSwap)\n');
  console.log(`Pair RES/WMATIC: ${pairAddress}`);
  console.log(`Router: ${routerAddress}`);
  console.log(`RES Token: ${resAddress}\n`);

  // Pair ABI
  const pairAbi = [
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() view returns (address)',
    'function token1() view returns (address)',
    'function totalSupply() view returns (uint256)',
  ];

  const pair = new ethers.Contract(pairAddress, pairAbi, provider);

  try {
    const [reserve0, reserve1, timestamp] = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const totalSupply = await pair.totalSupply();

    console.log('📊 Réserves de la pair:');
    console.log(`Token0: ${token0}`);
    console.log(`Reserve0: ${ethers.formatEther(reserve0)} tokens`);
    console.log(`Token1: ${token1}`);
    console.log(`Reserve1: ${ethers.formatEther(reserve1)} tokens`);
    console.log(`Total Supply LP: ${ethers.formatEther(totalSupply)}`);
    console.log(`Last Update: ${new Date(Number(timestamp) * 1000).toLocaleString()}\n`);

    if (reserve0 === 0n && reserve1 === 0n) {
      console.log('❌ PAS DE LIQUIDITÉ dans la pair !');
      console.log('\n💡 Solution:');
      console.log('   1. Obtenir plus de POL (besoin ~0.5 POL)');
      console.log('   2. Lancer: cd blockchain && npm run setup-liquidity');
      console.log('   3. Le script ajoutera de la liquidité WMATIC/RES\n');
    } else {
      console.log('✅ Liquidité présente dans la pair');

      // Identify which is RES
      const isToken0Res = token0.toLowerCase() === resAddress.toLowerCase();
      const resReserve = isToken0Res ? reserve0 : reserve1;
      const wmaticReserve = isToken0Res ? reserve1 : reserve0;

      console.log('\n📈 Prix approximatif:');
      if (resReserve > 0n && wmaticReserve > 0n) {
        const priceResInWmatic = Number(wmaticReserve) / Number(resReserve);
        const priceWmaticInRes = Number(resReserve) / Number(wmaticReserve);
        console.log(`1 RES ≈ ${priceResInWmatic.toFixed(6)} WMATIC`);
        console.log(`1 WMATIC ≈ ${priceWmaticInRes.toFixed(6)} RES`);
      }
    }

  } catch (err) {
    console.error('❌ Erreur lors de la lecture de la pair:');
    console.error(err.message);
    console.log('\n💡 La pair existe-t-elle ? Vérifier sur PolygonScan:');
    console.log(`   https://amoy.polygonscan.com/address/${pairAddress}`);
  }

  // Check router code
  console.log('\n🔧 Vérification du Router:');
  const routerCode = await provider.getCode(routerAddress);
  if (routerCode === '0x') {
    console.log('❌ Router pas déployé à cette adresse !');
  } else {
    console.log('✅ Router déployé et actif');
  }
}

main().catch(console.error);
