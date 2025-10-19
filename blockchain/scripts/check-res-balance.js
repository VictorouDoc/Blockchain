// Check real RES token balance for a wallet
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
  const deploymentData = JSON.parse(readFileSync(deploymentPath, 'utf-8'));
  const resAddress = deploymentData.contracts.RealEstateToken;

  console.log('🔍 Vérification balance RES\n');
  console.log(`RealEstateToken: ${resAddress}\n`);

  // ERC20 ABI minimal
  const erc20Abi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
  ];

  const resContract = new ethers.Contract(resAddress, erc20Abi, provider);

  // Get token info
  const name = await resContract.name();
  const symbol = await resContract.symbol();
  const decimals = await resContract.decimals();
  const totalSupply = await resContract.totalSupply();

  console.log(`Token: ${name} (${symbol})`);
  console.log(`Decimals: ${decimals}`);
  console.log(`Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}\n`);

  // Check deployer wallet (from .env)
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey);
  console.log(`Deployer Wallet: ${wallet.address}`);

  const deployerBalance = await resContract.balanceOf(wallet.address);
  console.log(`Balance: ${ethers.formatUnits(deployerBalance, decimals)} ${symbol}\n`);

  // Check if there are other addresses to check (ask user to provide)
  const testWallet = '0x5729471EE51FaEaF31fc093fd99E67f28429bf00'; // Same as deployer typically
  if (testWallet.toLowerCase() !== wallet.address.toLowerCase()) {
    const testBalance = await resContract.balanceOf(testWallet);
    console.log(`Test Wallet: ${testWallet}`);
    console.log(`Balance: ${ethers.formatUnits(testBalance, decimals)} ${symbol}`);
  }
}

main().catch(console.error);
