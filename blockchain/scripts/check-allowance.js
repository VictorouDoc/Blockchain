// Check current allowance for an address
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function symbol() external view returns (string)',
];

async function main() {
  const userAddress = process.argv[2];

  if (!userAddress || !ethers.isAddress(userAddress)) {
    console.error('❌ Adresse invalide');
    console.error('Usage: node scripts/check-allowance.js <address>');
    process.exit(1);
  }

  console.log('\n🔍 Vérification Allowance RES\n');
  console.log('Adresse:', userAddress);

  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
  );

  const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'deployments', 'sepolia-latest.json'), 'utf8')
  );

  const RES_ADDRESS = deployment.contracts.RealEstateToken;
  const ROUTER_ADDRESS = deployment.uniswapV2.router;

  const res = new ethers.Contract(RES_ADDRESS, ERC20_ABI, provider);

  const [balance, allowance, symbol] = await Promise.all([
    res.balanceOf(userAddress),
    res.allowance(userAddress, ROUTER_ADDRESS),
    res.symbol(),
  ]);

  const balanceFormatted = ethers.formatUnits(balance, 18);
  const allowanceFormatted = ethers.formatUnits(allowance, 18);

  console.log('\n📊 État actuel:');
  console.log('─'.repeat(70));
  console.log(`Balance ${symbol}:`.padEnd(30), balanceFormatted, symbol);
  console.log(`Allowance pour Router:`.padEnd(30), allowanceFormatted, symbol);
  console.log('─'.repeat(70));

  if (parseFloat(allowanceFormatted) === 0) {
    console.log('\n❌ PROBLÈME: Aucune allowance!');
    console.log('   → L\'approve n\'a pas été fait OU n\'est pas encore confirmé');
    console.log('   → Solution: Faire un approve et ATTENDRE la confirmation avant de swap');
  } else if (parseFloat(allowanceFormatted) < parseFloat(balanceFormatted)) {
    console.log('\n⚠️  ATTENTION: Allowance inférieure à la balance');
    console.log(`   → Tu peux swap max ${allowanceFormatted} ${symbol}`);
    console.log(`   → Si tu veux swap plus, il faut re-approve un montant plus élevé`);
  } else {
    console.log('\n✅ Allowance OK! Tu peux swap jusqu\'à', allowanceFormatted, symbol);
  }

  console.log('\n💡 Conseil: Approve un montant illimité pour éviter ce problème:');
  console.log('   → Dans MetaMask, clique "Use default" puis "Max" lors de l\'approve\n');
}

main().catch(console.error);
