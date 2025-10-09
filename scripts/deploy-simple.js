async function main() {
  console.log("🚀 Début du déploiement...\n");

  // Get signers
  const [deployer] = await ethers.getSigners();

  console.log("Déploiement avec le compte:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "POL\n");

  // 1. Deploy KYCRegistry
  console.log("📋 Déploiement de KYCRegistry...");
  const KYCRegistry = await ethers.getContractFactory("KYCRegistry");
  const kycRegistry = await KYCRegistry.deploy();
  await kycRegistry.waitForDeployment();
  const kycAddress = await kycRegistry.getAddress();
  console.log("✅ KYCRegistry:", kycAddress);

  // Whitelist deployer
  await kycRegistry.whitelist(deployer.address);
  console.log("✅ Deployer whitelisté\n");

  // 2. Deploy RealEstateToken
  console.log("🏠 Déploiement de RealEstateToken...");
  const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
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
  console.log("✅ RealEstateToken:", tokenAddress, "\n");

  // 3. Deploy PropertyNFT
  console.log("🖼️  Déploiement de PropertyNFT...");
  const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
  const nft = await PropertyNFT.deploy(kycAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ PropertyNFT:", nftAddress, "\n");

  // 4. Mint example NFT
  console.log("🎨 Mint d'un NFT d'exemple...");
  await nft.mintProperty(
    deployer.address,
    "123 Avenue des Champs-Élysées, Paris",
    250,
    50000000,
    "ipfs://QmExample",
    "ipfs://QmToken"
  );
  console.log("✅ NFT #0 minté\n");

  console.log("=".repeat(50));
  console.log("✅ DÉPLOIEMENT TERMINÉ !");
  console.log("=".repeat(50));
  console.log("\n📋 ADRESSES DES CONTRATS :");
  console.log("  KYCRegistry:     ", kycAddress);
  console.log("  RealEstateToken: ", tokenAddress);
  console.log("  PropertyNFT:     ", nftAddress);
  console.log("\n💡 Partage ces adresses avec ton équipe !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
