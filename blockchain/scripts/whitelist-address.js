// Whitelist any address in KYCRegistry
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
  // Get address from command line
  const addressToWhitelist = process.argv[2];
  if (!addressToWhitelist) {
    console.error('❌ Error: Please provide an address to whitelist');
    console.error('Usage: node scripts/whitelist-address.js <address>');
    process.exit(1);
  }

  // Validate address format
  if (!ethers.isAddress(addressToWhitelist)) {
    console.error('❌ Error: Invalid Ethereum address format');
    process.exit(1);
  }

  console.log('✅ Whitelist Address in KYCRegistry\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
  );

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log('Admin (owner):', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Balance ETH:', ethers.formatEther(balance), 'ETH\n');

  // Load deployment
  const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'deployments', 'sepolia-latest.json'), 'utf8')
  );

  const KYC_ADDRESS = deployment.contracts.KYCRegistry;

  console.log('📍 Contracts:');
  console.log('  KYCRegistry:', KYC_ADDRESS);
  console.log('  Address to whitelist:', addressToWhitelist);
  console.log('');

  // Connect to KYCRegistry
  const kyc = new ethers.Contract(KYC_ADDRESS, KYC_ABI, wallet);

  // Check if address is already whitelisted
  console.log('1️⃣  Checking current whitelist status...');
  const isWhitelisted = await kyc.isWhitelisted(addressToWhitelist);

  if (isWhitelisted) {
    console.log('   ✅ Address already whitelisted!\n');
    return;
  }

  console.log('   ⚠️  Address not yet whitelisted\n');
  console.log('2️⃣  Whitelisting address...');
  
  const tx = await kyc.whitelist(addressToWhitelist);
  console.log('   TX:', tx.hash);
  await tx.wait();
  console.log('   ✅ Address whitelisted successfully!\n');

  console.log('🎉 Success!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Address whitelisted:', addressToWhitelist);
  console.log('Transaction:', tx.hash);
  console.log('════════════════════════════════════════════════════════════\n');

  console.log('✅ The address can now:');
  console.log('  - Send/receive RES tokens');
  console.log('  - Create/trade PropertyNFTs');
  console.log('  - Use Uniswap V2 for trading\n');
}

main().catch(console.error);