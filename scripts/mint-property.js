import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const deployments = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../deployments/sepolia-latest.json'),
    'utf8'
  )
);

async function main() {
  console.log("\n🔄 Starting NFT minting process...");
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("🔑 Using address:", wallet.address);
  
  // Load contract ABI
  const PropertyNFTArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../blockchain/artifacts/contracts/PropertyNFT.sol/PropertyNFT.json'),
      'utf8'
    )
  );
  
  // Get contract
  console.log("\n📄 Getting PropertyNFT contract...");
  console.log("Contract address:", deployments.contracts.PropertyNFT);
  
  const propertyNFT = new ethers.Contract(
    deployments.contracts.PropertyNFT,
    PropertyNFTArtifact.abi,
    wallet
  );

  // Example property data
  const propertyData = {
    address: "123 Crypto Street, Paris, France",
    surface: 100, // 100m²
    value: 50000000, // $500,000 (avec 2 décimales)
    documentURI: "ipfs://QmExample", // à remplacer par un vrai hash IPFS si besoin
    tokenURI: "" // laissé vide pour utiliser le format on-chain par défaut
  };

  // Your address (le owner)
  // Using signer address as owner

  console.log("\n🏠 Minting property NFT with details:");
  console.log("- To address:", wallet.address);
  console.log("- Property:", propertyData.address);
  console.log("- Surface:", propertyData.surface, "m²");
  console.log("- Value: $", propertyData.value / 100);
  console.log("- Doc URI:", propertyData.documentURI);
  
  console.log("\n📝 Sending transaction...");
  const tx = await propertyNFT.mintProperty(
    wallet.address,
    propertyData.address,
    propertyData.surface,
    propertyData.value,
    propertyData.documentURI,
    propertyData.tokenURI
  );

  console.log("Transaction hash:", tx.hash);
  console.log("\n⏳ Waiting for confirmation...");
  await tx.wait();

  console.log("\n✅ NFT minted successfully!");
  const totalMinted = await propertyNFT.totalMinted();
  console.log("📊 Total NFTs minted:", totalMinted);
  console.log("\n🔍 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/tx/${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });