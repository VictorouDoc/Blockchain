// Transfer RES tokens to another address (for testing)
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
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Load deployment
  const deploymentPath = join(__dirname, '../../deployments/amoy-latest.json');
  const deployment = JSON.parse(readFileSync(deploymentPath, 'utf-8'));
  const resAddress = deployment.contracts.RealEstateToken;

  console.log('💸 Transfer RES tokens\n');
  console.log(`From: ${wallet.address}`);

  // Get recipient address
  const recipientArg = process.argv[2];
  const amountArg = process.argv[3];

  if (!recipientArg || !amountArg) {
    console.log('Usage: node transfer-res-tokens.js <recipient_address> <amount>');
    console.log('Example: node transfer-res-tokens.js 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 100');
    process.exit(1);
  }

  const recipient = recipientArg;
  const amount = amountArg;

  // ERC20 ABI
  const erc20Abi = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];

  const resContract = new ethers.Contract(resAddress, erc20Abi, wallet);

  // Check balance
  const balance = await resContract.balanceOf(wallet.address);
  const decimals = await resContract.decimals();

  console.log(`Current balance: ${ethers.formatUnits(balance, decimals)} RES`);
  console.log(`To: ${recipient}`);
  console.log(`Amount: ${amount} RES\n`);

  const amountWei = ethers.parseUnits(amount, decimals);

  if (amountWei > balance) {
    console.error('❌ Solde insuffisant !');
    process.exit(1);
  }

  // Transfer
  console.log('📤 Transfert en cours...');
  const tx = await resContract.transfer(recipient, amountWei);
  console.log(`TX Hash: ${tx.hash}`);
  console.log('⏳ Attente confirmation...');

  await tx.wait();
  console.log('✅ Transfert réussi !');

  // Check new balances
  const newBalanceFrom = await resContract.balanceOf(wallet.address);
  const newBalanceTo = await resContract.balanceOf(recipient);

  console.log(`\nNouveau balance:`);
  console.log(`From: ${ethers.formatUnits(newBalanceFrom, decimals)} RES`);
  console.log(`To: ${ethers.formatUnits(newBalanceTo, decimals)} RES`);
}

main().catch(console.error);
