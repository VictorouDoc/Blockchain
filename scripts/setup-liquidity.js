import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uniswap V2 addresses on Polygon Amoy Testnet
// Note: If these don't exist on Amoy, we'll use QuickSwap (Uniswap V2 fork)
const UNISWAP_V2_ROUTER = "0x8954AfA98594b838bda56FE4C12a09D7739D179b"; // QuickSwap Router on Amoy
const UNISWAP_V2_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32"; // QuickSwap Factory on Amoy

async function main() {
  console.log("🏊 Setup Liquidity Pool pour RealEstateToken");
  console.log("==========================================\n");

  // Get network info
  const networkName = hre.network.name || hre.config.defaultNetwork || "hardhat";
  console.log("Network:", networkName);

  // Get provider and signer
  const provider = hre.network.provider ?
    new ethers.BrowserProvider(hre.network.provider) :
    new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  const deployer = await provider.getSigner(0);
  console.log("Deployer:", deployer.address);

  const balance = await provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC\n");

  // Load deployed contract addresses
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFiles = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith(networkName))
    .sort()
    .reverse();

  if (deploymentFiles.length === 0) {
    throw new Error(`Aucun déploiement trouvé pour le network ${networkName}`);
  }

  const latestDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, deploymentFiles[0]), "utf8")
  );

  const TOKEN_ADDRESS = latestDeployment.contracts.RealEstateToken;
  const KYC_ADDRESS = latestDeployment.contracts.KYCRegistry;

  console.log("📍 Adresses des contrats:");
  console.log("  RealEstateToken:", TOKEN_ADDRESS);
  console.log("  KYCRegistry:", KYC_ADDRESS, "\n");

  // Get contract artifacts
  const tokenArtifact = await hre.artifacts.readArtifact("RealEstateToken");
  const token = new ethers.Contract(TOKEN_ADDRESS, tokenArtifact.abi, deployer);

  const kycArtifact = await hre.artifacts.readArtifact("KYCRegistry");
  const kyc = new ethers.Contract(KYC_ADDRESS, kycArtifact.abi, deployer);

  // Router and Factory contracts (for local testing, we'll use mock addresses)
  let routerAddress = UNISWAP_V2_ROUTER;
  let factoryAddress = UNISWAP_V2_FACTORY;

  // For localhost/hardhat, we would need to deploy Uniswap V2 contracts
  if (networkName === "hardhat" || networkName === "localhost") {
    console.log("⚠️  Mode local détecté - Vous devrez déployer Uniswap V2 localement");
    console.log("   Pour l'instant, ce script fonctionne uniquement sur testnet (Amoy)\n");

    // Alternative: on peut créer un simple mock DEX
    console.log("💡 Alternative: Créer une simple paire de tokens manuellement");
    console.log("   ou utiliser un fork de Polygon Mainnet avec Hardhat\n");

    return;
  }

  // Import Router interface
  const routerABI = [
    "function factory() external pure returns (address)",
    "function WETH() external pure returns (address)",
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
    "function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)"
  ];

  const factoryABI = [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
    "function createPair(address tokenA, address tokenB) external returns (address pair)"
  ];

  const router = new ethers.Contract(routerAddress, routerABI, deployer);
  const factory = new ethers.Contract(factoryAddress, factoryABI, deployer);

  // Get WMATIC address
  const WMATIC = await router.WETH();
  console.log("💰 WMATIC address:", WMATIC, "\n");

  // Check if pair already exists
  let pairAddress = await factory.getPair(TOKEN_ADDRESS, WMATIC);

  if (pairAddress === ethers.ZeroAddress) {
    console.log("🔧 Création de la paire RES/WMATIC...");
    const createTx = await factory.createPair(TOKEN_ADDRESS, WMATIC);
    await createTx.wait();
    pairAddress = await factory.getPair(TOKEN_ADDRESS, WMATIC);
    console.log("✅ Paire créée:", pairAddress, "\n");
  } else {
    console.log("✅ Paire existante trouvée:", pairAddress, "\n");
  }

  // Whitelist the router so it can receive tokens
  const isRouterWhitelisted = await kyc.isAuthorized(routerAddress);
  if (!isRouterWhitelisted) {
    console.log("🔐 Whitelist du router Uniswap...");
    const whitelistTx = await kyc.whitelist(routerAddress);
    await whitelistTx.wait();
    console.log("✅ Router whitelisté\n");
  }

  // Whitelist the pair contract
  const isPairWhitelisted = await kyc.isAuthorized(pairAddress);
  if (!isPairWhitelisted) {
    console.log("🔐 Whitelist de la paire RES/WMATIC...");
    const whitelistPairTx = await kyc.whitelist(pairAddress);
    await whitelistPairTx.wait();
    console.log("✅ Paire whitelistée\n");
  }

  // Amount of tokens to add as liquidity
  const tokenAmount = ethers.parseEther("100"); // 100 RES tokens
  const maticAmount = ethers.parseEther("0.1"); // 0.1 MATIC

  console.log("💧 Ajout de liquidité:");
  console.log("  Tokens RES:", ethers.formatEther(tokenAmount));
  console.log("  MATIC:", ethers.formatEther(maticAmount), "\n");

  // Approve router to spend tokens
  console.log("✍️  Approval du router...");
  const approveTx = await token.approve(routerAddress, tokenAmount);
  await approveTx.wait();
  console.log("✅ Router approuvé\n");

  // Add liquidity
  console.log("🏊 Ajout de liquidité...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const liquidityTx = await router.addLiquidityETH(
    TOKEN_ADDRESS,
    tokenAmount,
    0, // amountTokenMin (accept any)
    0, // amountETHMin (accept any)
    deployer.address,
    deadline,
    { value: maticAmount }
  );

  const receipt = await liquidityTx.wait();
  console.log("✅ Liquidité ajoutée!");
  console.log("   Transaction:", receipt.hash, "\n");

  // Test swap quote
  console.log("📊 Test de quote pour 1 MATIC → RES:");
  try {
    const path = [WMATIC, TOKEN_ADDRESS];
    const amountsOut = await router.getAmountsOut(ethers.parseEther("1"), path);
    console.log("   1 MATIC =", ethers.formatEther(amountsOut[1]), "RES\n");
  } catch (error) {
    console.log("   ⚠️  Quote impossible (liquidité insuffisante?)\n");
  }

  // Save pool info
  const poolInfo = {
    network: networkName,
    timestamp: new Date().toISOString(),
    pair: pairAddress,
    router: routerAddress,
    factory: factoryAddress,
    token: TOKEN_ADDRESS,
    wmatic: WMATIC,
    initialLiquidity: {
      tokens: ethers.formatEther(tokenAmount),
      matic: ethers.formatEther(maticAmount)
    }
  };

  const poolFile = path.join(deploymentsDir, `pool-${networkName}-${Date.now()}.json`);
  fs.writeFileSync(poolFile, JSON.stringify(poolInfo, null, 2));

  console.log("📋 Résumé:");
  console.log("   Paire:", pairAddress);
  console.log("   Router:", routerAddress);
  console.log("   Liquidité initiale: 100 RES + 0.1 MATIC");
  console.log("\n💾 Info sauvegardée dans:", poolFile);

  console.log("\n✅ DEX Setup complet!");
  console.log("\n💡 Prochaines étapes:");
  console.log("   1. Tester un swap sur le DEX");
  console.log("   2. Vérifier que seuls les whitelisted peuvent trader");
  console.log("   3. Intégrer dans le frontend\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
