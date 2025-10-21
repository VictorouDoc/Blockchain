// Deploy all contracts on Sepolia testnet
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  console.log('🚀 Déploiement complet sur Ethereum Sepolia\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log('Déploiement avec le compte:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH\n');

  if (parseFloat(ethers.formatEther(balance)) < 0.1) {
    console.error('❌ Solde ETH insuffisant (besoin >= 0.1 ETH)');
    console.log('💡 Obtenir Sepolia ETH:');
    console.log('   - https://sepoliafaucet.com');
    console.log('   - https://www.alchemy.com/faucets/ethereum-sepolia');
    console.log('   - https://cloud.google.com/application/web3/faucet/ethereum/sepolia');
    process.exit(1);
  }

  // Load artifacts
  const artifactsPath = path.join(__dirname, '../artifacts/contracts');

  const kycArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, 'KYCRegistry.sol/KYCRegistry.json'), 'utf8')
  );

  const tokenArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, 'RealEstateToken.sol/RealEstateToken.json'), 'utf8')
  );

  const nftArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, 'PropertyNFT.sol/PropertyNFT.json'), 'utf8')
  );

  const simpleFactoryArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, 'SimpleTokenFactory.sol/SimpleTokenFactory.json'), 'utf8')
  );

  // 1. Deploy KYCRegistry
  console.log('1️⃣ Déploiement KYCRegistry...');
  const KYCRegistry = new ethers.ContractFactory(
    kycArtifact.abi,
    kycArtifact.bytecode,
    wallet
  );
  const kycRegistry = await KYCRegistry.deploy();
  await kycRegistry.waitForDeployment();
  const kycAddress = await kycRegistry.getAddress();
  console.log('✅ KYCRegistry:', kycAddress);

  // Whitelist deployer
  console.log('   Whitelisting deployer...');
  const whitelistTx = await kycRegistry.whitelist(wallet.address);
  await whitelistTx.wait();
  console.log('   ✅ Deployer whitelisted\n');

  // 2. Deploy RealEstateToken
  console.log('2️⃣ Déploiement RealEstateToken...');
  const RealEstateToken = new ethers.ContractFactory(
    tokenArtifact.abi,
    tokenArtifact.bytecode,
    wallet
  );

  const token = await RealEstateToken.deploy(
    'Real Estate Share',
    'RES',
    kycAddress,
    '123 Main St, Paris',
    500000, // $500k property value
    1000    // 1000 shares
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log('✅ RealEstateToken:', tokenAddress, '\n');

  // 3. Deploy PropertyNFT
  console.log('3️⃣ Déploiement PropertyNFT...');
  const PropertyNFT = new ethers.ContractFactory(
    nftArtifact.abi,
    nftArtifact.bytecode,
    wallet
  );

  const nft = await PropertyNFT.deploy(kycAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log('✅ PropertyNFT:', nftAddress, '\n');

  // 4. Deploy SimpleTokenFactory
  console.log('4️⃣ Déploiement SimpleTokenFactory...');
  const SimpleTokenFactory = new ethers.ContractFactory(
    simpleFactoryArtifact.abi,
    simpleFactoryArtifact.bytecode,
    wallet
  );

  const factory = await SimpleTokenFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log('✅ SimpleTokenFactory:', factoryAddress, '\n');

  // Save deployment
  const deployment = {
    network: 'sepolia',
    chainId: 11155111,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contracts: {
      KYCRegistry: kycAddress,
      RealEstateToken: tokenAddress,
      PropertyNFT: nftAddress,
      SimpleTokenFactory: factoryAddress,
    },
    uniswap: {
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    },
  };

  const deploymentsDir = path.join(__dirname, '../../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, 'sepolia-latest.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log('📝 Résumé du déploiement:');
  console.log('═'.repeat(60));
  console.log('Network:            Sepolia (Chain ID: 11155111)');
  console.log('Deployer:          ', wallet.address);
  console.log('KYCRegistry:       ', kycAddress);
  console.log('RealEstateToken:   ', tokenAddress);
  console.log('PropertyNFT:       ', nftAddress);
  console.log('SimpleTokenFactory:', factoryAddress);
  console.log('═'.repeat(60));

  console.log('\n🔗 Uniswap V2 (Sepolia):');
  console.log('Router:  0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
  console.log('Factory: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f');
  console.log('WETH:    0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14');

  console.log('\n⚙️ Mettre à jour frontend/.env:');
  console.log(`VITE_NETWORK=sepolia`);
  console.log(`VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org`);
  console.log(`VITE_KYC_REGISTRY_ADDRESS=${kycAddress}`);
  console.log(`VITE_ERC20_ADDRESS=${tokenAddress}`);
  console.log(`VITE_ERC721_ADDRESS=${nftAddress}`);
  console.log(`VITE_TOKEN_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`VITE_UNISWAP_ROUTER=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`);
  console.log(`VITE_UNISWAP_FACTORY=0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f`);
  console.log(`VITE_WETH=0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`);

  console.log('\n✅ Déploiement terminé! Fichier sauvegardé:', deploymentPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
