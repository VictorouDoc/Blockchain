import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function main() {
  // Load contract artifacts
  const tokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/RealEstateToken.sol/RealEstateToken.json"), "utf8"));
  const nftArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/PropertyNFT.sol/PropertyNFT.json"), "utf8"));

  console.log("🚀 Déploiement des contrats restants sur Polygon Amoy\n");

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Déploiement avec le compte:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "POL\n");

  // KYCRegistry déjà déployé !
  const kycAddress = "0xc7B79aA94E94c0426005B44C23956Af428247403";
  console.log("✅ KYCRegistry (déjà déployé):", kycAddress, "\n");

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
    },
    tokenInfo: {
      name: "Real Estate Share",
      symbol: "RES",
      totalSupply: ethers.formatEther(await token.totalSupply()),
      propertyAddress: await token.propertyAddress(),
      propertyValue: (await token.propertyValue()).toString(),
      totalShares: (await token.totalShares()).toString()
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
  console.log("\n🔗 Vérifie sur Polygonscan:");
  console.log("  https://amoy.polygonscan.com/address/" + kycAddress);
  console.log("  https://amoy.polygonscan.com/address/" + tokenAddress);
  console.log("  https://amoy.polygonscan.com/address/" + nftAddress);
  console.log("\n💡 Partage ces adresses avec ton équipe !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  });
