// Check POL balance and contract deployment status on Amoy
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
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ PRIVATE_KEY manquante dans .env');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('🔍 Vérification du wallet sur Amoy testnet\n');
  console.log(`Wallet: ${wallet.address}`);

  // Check POL balance
  const balance = await provider.getBalance(wallet.address);
  const balancePOL = ethers.formatEther(balance);
  console.log(`Balance POL: ${balancePOL} POL`);

  if (parseFloat(balancePOL) < 0.1) {
    console.log('\n⚠️  Solde POL faible! Obtiens des POL testnet:');
    console.log('   🚰 Faucet 1: https://faucet.polygon.technology/');
    console.log('   🚰 Faucet 2: https://www.alchemy.com/faucets/polygon-amoy');
  } else {
    console.log('✅ Solde POL suffisant');
  }

  // Check deployed contracts
  console.log('\n📋 Contrats déployés:');

  const deploymentPath = join(__dirname, '../../deployments/amoy-latest.json');
  try {
    const deploymentData = JSON.parse(readFileSync(deploymentPath, 'utf-8'));
    const contracts = deploymentData.contracts;

    for (const [name, address] of Object.entries(contracts)) {
      if (address === '0x0000000000000000000000000000000000000000') {
        console.log(`   ❌ ${name}: Non déployé`);
      } else {
        const code = await provider.getCode(address);
        if (code === '0x') {
          console.log(`   ⚠️  ${name}: ${address} (pas de code!)`);
        } else {
          console.log(`   ✅ ${name}: ${address}`);
        }
      }
    }
  } catch (err) {
    console.log('   ⚠️  Impossible de lire deployments/amoy-latest.json');
  }
}

main().catch(console.error);
