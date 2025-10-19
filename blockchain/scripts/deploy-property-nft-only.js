// Deploy only PropertyNFT (KYCRegistry already deployed)
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
  console.log("🚀 Déploiement PropertyNFT sur Polygon Amoy\n");

  // Load existing deployment
  const deploymentPath = path.join(__dirname, "../../deployments/amoy-latest.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const kycAddress = deployment.contracts.KYCRegistry;

  console.log("KYCRegistry existant:", kycAddress);

  // Load contract artifact
  const nftArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../artifacts/contracts/PropertyNFT.sol/PropertyNFT.json"),
      "utf8"
    )
  );

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Déploiement avec le compte:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "POL\n");

  if (parseFloat(ethers.formatEther(balance)) < 0.01) {
    console.error("❌ Solde POL insuffisant (besoin >= 0.01 POL)");
    process.exit(1);
  }

  // Deploy PropertyNFT (constructor takes only kycRegistry address)
  console.log("🏘️ Déploiement de PropertyNFT...");
  const PropertyNFT = new ethers.ContractFactory(nftArtifact.abi, nftArtifact.bytecode, wallet);
  const nft = await PropertyNFT.deploy(kycAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ PropertyNFT:", nftAddress);

  // Update deployment file
  deployment.contracts.PropertyNFT = nftAddress;
  deployment.timestamp = new Date().toISOString();

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n✅ Fichier de déploiement mis à jour:", deploymentPath);

  console.log("\n📝 Résumé:");
  console.log("KYCRegistry:", kycAddress);
  console.log("RealEstateToken:", deployment.contracts.RealEstateToken);
  console.log("PropertyNFT:", nftAddress);

  console.log("\n⚠️  N'oublie pas de mettre à jour frontend/.env:");
  console.log(`VITE_ERC721_ADDRESS=${nftAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
