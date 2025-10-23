// Simple script to whitelist a user address
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

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
    console.error('\n❌ Error: Please provide an address to whitelist\n');
    console.error('Usage: node scripts/whitelist-user.js <address>\n');
    console.error('Example: node scripts/whitelist-user.js 0x1234567890123456789012345678901234567890\n');
    process.exit(1);
  }

  // Validate address format
  if (!ethers.isAddress(addressToWhitelist)) {
    console.error('❌ Error: Invalid Ethereum address format\n');
    process.exit(1);
  }

  console.log('\n🔐 Whitelisting User in KYCRegistry\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('👤 Admin (owner):', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'ETH\n');

  // Load deployment
  const deployment = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../deployments/sepolia-latest.json'),
      'utf8'
    )
  );

  const KYC_ADDRESS = deployment.contracts.KYCRegistry;

  console.log('📍 Contract Address:', KYC_ADDRESS);
  console.log('🎯 Address to whitelist:', addressToWhitelist, '\n');

  // Connect to KYCRegistry
  const kyc = new ethers.Contract(KYC_ADDRESS, KYC_ABI, wallet);

  // Check if address is already whitelisted
  console.log('🔍 Checking current status...');
  const isWhitelisted = await kyc.isWhitelisted(addressToWhitelist);

  if (isWhitelisted) {
    console.log('   ✅ Address is already whitelisted!\n');
    console.log('👉 The user can now:');
    console.log('   - Send/receive RES tokens');
    console.log('   - Create/trade PropertyNFTs');
    console.log('   - Use Uniswap V2 for trading\n');
    return;
  }

  console.log('   ⚠️  Address not yet whitelisted\n');
  console.log('📝 Whitelisting address...');
  
  const tx = await kyc.whitelist(addressToWhitelist);
  console.log('   TX hash:', tx.hash);
  console.log('   ⏳ Waiting for confirmation...');
  await tx.wait();
  
  console.log('\n✅ Success! Address whitelisted!\n');
  console.log('🔗 View on Etherscan:');
  console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}\n`);
  
  console.log('👉 The user can now:');
  console.log('   - Send/receive RES tokens');
  console.log('   - Create/trade PropertyNFTs');
  console.log('   - Use Uniswap V2 for trading\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  });
