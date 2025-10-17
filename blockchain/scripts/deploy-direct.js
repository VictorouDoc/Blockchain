import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  // Load contract artifacts
  const kycArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/KYCRegistry.sol/KYCRegistry.json"), "utf8"));
  const tokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/RealEstateToken.sol/RealEstateToken.json"), "utf8"));
  const nftArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/PropertyNFT.sol/PropertyNFT.json"), "utf8"));
  console.log("🚀 Début du déploiement sur Polygon Amoy\n");

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Déploiement avec le compte:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "POL\n");

  // 1. Deploy KYCRegistry
  console.log("📋 Déploiement de KYCRegistry...");
  const KYCRegistry = new ethers.ContractFactory(kycArtifact.abi, kycArtifact.bytecode, wallet);
  const kycRegistry = await KYCRegistry.deploy();
  await kycRegistry.waitForDeployment();
  const kycAddress = await kycRegistry.getAddress();
  console.log("✅ KYCRegistry:", kycAddress);

  // Whitelist deployer
  console.log("🔐 Whitelist du deployer...");
  const whitelistTx = await kycRegistry.whitelist(wallet.address);
  await whitelistTx.wait(); // Wait for confirmation
  console.log("✅ Deployer whitelisté\n");

  // Wait a bit for the blockchain to process
  console.log("⏳ Attente de confirmation...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 2. Deploy RealEstateToken
  console.log("🏠 Déploiement de RealEstateToken...");
  const RealEstateToken = new ethers.ContractFactory(tokenArtifact.abi, tokenArtifact.bytecode, wallet);
  const token = await RealEstateToken.deploy(
    "Real Estate Share",
    "RES",
    kycAddress,
    "123 Avenue des Champs-Élysées, Paris",
    50000000,
    1000
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ RealEstateToken:", tokenAddress);
  console.log("   Supply:", ethers.formatEther(await token.totalSupply()), "RES\n");

  // 3. Deploy PropertyNFT
  console.log("🖼️  Déploiement de PropertyNFT...");
  const PropertyNFT = new ethers.ContractFactory(nftArtifact.abi, nftArtifact.bytecode, wallet);
  const nft = await PropertyNFT.deploy(kycAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ PropertyNFT:", nftAddress, "\n");

  // 4. Mint example NFT
  console.log("🎨 Mint d'un NFT d'exemple...");
  const mintTx = await nft.mintProperty(
    wallet.address,
    "123 Avenue des Champs-Élysées, Paris",
    250,
    50000000,
    "ipfs://QmExample",
    "ipfs://QmToken"
  );
  await mintTx.wait();
  console.log("✅ NFT #0 minté\n");

  // Save deployment info
  const deploymentInfo = {
    network: "amoy",
    chainId: 80002,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contracts: {
      KYCRegistry: kycAddress,
      RealEstateToken: tokenAddress,
      PropertyNFT: nftAddress
    }
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, `amoy-${Date.now()}.json`);
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

  console.log("=".repeat(60));
  console.log("✅ DÉPLOIEMENT TERMINÉ !");
  console.log("=".repeat(60));
  console.log("\n📋 ADRESSES DES CONTRATS :");
  console.log("  KYCRegistry:     ", kycAddress);
  console.log("  RealEstateToken: ", tokenAddress);
  console.log("  PropertyNFT:     ", nftAddress);
  console.log("\n💾 Sauvegardé dans:", filename);
  console.log("\n💡 Partage ces adresses avec ton équipe !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });
