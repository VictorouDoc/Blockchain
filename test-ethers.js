import hre from "hardhat";
import { ethers as directEthers } from "ethers";

async function main() {
  // Method 1: Try getting it from hre
  console.log("hre.ethers:", !!hre.ethers);
  
  // Method 2: Try importing directly
  console.log("directEthers:", !!directEthers);
  
  // Method 3: Try using artifacts
  console.log("hre.artifacts:", !!hre.artifacts);
  
  // Method 4: Check what's in hre
  console.log("hre keys:", Object.keys(hre));
}

main();
