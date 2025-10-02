import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Get provider from hardhat network
  const provider = hre.network.provider ?
    new ethers.BrowserProvider(hre.network.provider) :
    new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Get signer (for hardhat network, use the first default account)
  const deployer = await provider.getSigner(0);

  const networkName = hre.network.name || hre.config.defaultNetwork || "hardhat";
  console.log("🚀 Début du déploiement sur", networkName);
  console.log("==========================================\n");

  console.log("Déploiement avec le compte:", deployer.address);

  const balance = await provider.getBalance(deployer.address);
  console.log("Balance du compte:", ethers.formatEther(balance), "ETH\n");

  // Get contract factory using artifacts
  const getContractFactory = async (contractName) => {
    const artifact = await hre.artifacts.readArtifact(contractName);
    return new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  };

  // 1. Déployer KYCRegistry
  console.log("📋 Déploiement de KYCRegistry...");
  const KYCRegistry = await getContractFactory("KYCRegistry");
  const kycRegistry = await KYCRegistry.deploy();
  await kycRegistry.waitForDeployment();
  const kycAddress = await kycRegistry.getAddress();
  console.log("✅ KYCRegistry déployé à:", kycAddress);

  // Whitelister le deployer
  console.log("🔐 Whitelist du deployer...");
  await kycRegistry.whitelist(deployer.address);
  console.log("✅ Deployer whitelisté\n");

  // 2. Déployer RealEstateToken
  console.log("🏠 Déploiement de RealEstateToken...");
  const RealEstateToken = await getContractFactory("RealEstateToken");
  const token = await RealEstateToken.deploy(
    "Real Estate Share",
    "RES",
    kycAddress,
    "123 Avenue des Champs-Élysées, Paris, France",
    50000000, // $500,000.00
    1000      // 1000 shares
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ RealEstateToken déployé à:", tokenAddress);
  console.log("   Supply totale:", ethers.formatEther(await token.totalSupply()), "RES\n");

  // 3. Déployer PropertyNFT
  console.log("🖼️  Déploiement de PropertyNFT...");
  const PropertyNFT = await getContractFactory("PropertyNFT");
  const nft = await PropertyNFT.deploy(kycAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ PropertyNFT déployé à:", nftAddress);
  console.log("   Nom:", await nft.name());
  console.log("   Symbole:", await nft.symbol(), "\n");

  // 4. Mint un NFT d'exemple
  console.log("🎨 Mint d'un NFT d'exemple...");
  const mintTx = await nft.mintProperty(
    deployer.address,
    "123 Avenue des Champs-Élysées, Paris, France",
    250, // 250 m²
    50000000, // $500,000.00
    "ipfs://QmExample123",
    "ipfs://QmTokenURI456"
  );
  await mintTx.wait();
  console.log("✅ NFT #0 minté au deployer\n");

  // Sauvegarder les adresses des contrats
  const network = await provider.getNetwork();
  const deploymentInfo = {
    network: networkName,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
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

  const filename = path.join(
    deploymentsDir,
    `${networkName}-${Date.now()}.json`
  );
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

  console.log(" Résumé:");
  console.log("   Network:", networkName);
  console.log("   KYCRegistry:", kycAddress);
  console.log("   RealEstateToken:", tokenAddress);
  console.log("   PropertyNFT:", nftAddress);
  console.log("\n💾 Informations sauvegardées dans:", filename);

  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\n Attendre 30 secondes avant la vérification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log("\n Vérification des contrats sur Polygonscan...");

    try {
      await hre.run("verify:verify", {
        address: kycAddress,
        constructorArguments: [],
      });
      console.log("KYCRegistry vérifié");
    } catch (error) {
      console.log("Erreur lors de la vérification de KYCRegistry:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [
          "Real Estate Share",
          "RES",
          kycAddress,
          "123 Avenue des Champs-Élysées, Bamako lol, France",
          50000000,
          1000
        ],
      });
      console.log("RealEstateToken vérifié");
    } catch (error) {
      console.log("Erreur lors de la vérification de RealEstateToken:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: nftAddress,
        constructorArguments: [kycAddress],
      });
      console.log("PropertyNFT vérifié");
    } catch (error) {
      console.log("Erreur lors de la vérification de PropertyNFT:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });