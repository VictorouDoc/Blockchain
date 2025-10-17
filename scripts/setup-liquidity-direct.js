import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// DonaSwap V2 addresses on Polygon Amoy (Uniswap V2 fork)
const DONASWAP_ROUTER = "0x6E682B51F8bb67294B522b75a1E79dDd4502cc94";

async function main() {
  console.log("🏊 Setup Liquidity Pool - DonaSwap V2 (Amoy)");
  console.log("=" .repeat(60), "\n");

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Wallet:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "POL\n");

  if (parseFloat(ethers.formatEther(balance)) < 0.15) {
    console.log("⚠️  ATTENTION: Balance très faible!");
    console.log("   Besoin d'au moins 0.15 POL pour setup la pool");
    console.log("   (0.1 POL pour liquidité + 0.05 POL pour gas)\n");

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await new Promise(resolve => {
      rl.question("Continuer quand même ? (y/n): ", answer => {
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log("Annulé.");
          process.exit(0);
        }
        resolve();
      });
    });
  }

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFiles = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith("amoy"))
    .sort()
    .reverse();

  if (deploymentFiles.length === 0) {
    throw new Error("Aucun déploiement Amoy trouvé");
  }

  const deployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, deploymentFiles[0]), "utf8")
  );

  const TOKEN_ADDRESS = deployment.contracts.RealEstateToken;
  const KYC_ADDRESS = deployment.contracts.KYCRegistry;

  console.log("📍 Adresses:");
  console.log("  RealEstateToken:", TOKEN_ADDRESS);
  console.log("  KYCRegistry:", KYC_ADDRESS);
  console.log("  DonaSwap Router:", DONASWAP_ROUTER, "\n");

  // Load contract ABIs
  const tokenArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/RealEstateToken.sol/RealEstateToken.json"), "utf8")
  );
  const kycArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/KYCRegistry.sol/KYCRegistry.json"), "utf8")
  );

  const token = new ethers.Contract(TOKEN_ADDRESS, tokenArtifact.abi, wallet);
  const kyc = new ethers.Contract(KYC_ADDRESS, kycArtifact.abi, wallet);

  // Router and Factory ABIs
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

  const router = new ethers.Contract(DONASWAP_ROUTER, routerABI, wallet);

  // Get WMATIC address
  const WMATIC = await router.WETH();
  console.log("💰 WMATIC:", WMATIC);

  // Get factory address from router
  const DONASWAP_FACTORY = await router.factory();
  console.log("🏭 Factory:", DONASWAP_FACTORY, "\n");

  const factory = new ethers.Contract(DONASWAP_FACTORY, factoryABI, wallet);

  // Check if pair exists
  let pairAddress = await factory.getPair(TOKEN_ADDRESS, WMATIC);

  if (pairAddress === ethers.ZeroAddress) {
    console.log("🔧 Création de la paire RES/WMATIC...");
    const createTx = await factory.createPair(TOKEN_ADDRESS, WMATIC);
    console.log("   TX:", createTx.hash);
    await createTx.wait();
    pairAddress = await factory.getPair(TOKEN_ADDRESS, WMATIC);
    console.log("✅ Paire créée:", pairAddress, "\n");
  } else {
    console.log("✅ Paire existante:", pairAddress, "\n");
  }

  // Whitelist router
  const isRouterWhitelisted = await kyc.isAuthorized(DONASWAP_ROUTER);
  if (!isRouterWhitelisted) {
    console.log("🔐 Whitelist du router...");
    const whitelistTx = await kyc.whitelist(DONASWAP_ROUTER);
    console.log("   TX:", whitelistTx.hash);
    await whitelistTx.wait();
    console.log("✅ Router whitelisté\n");
  } else {
    console.log("✅ Router déjà whitelisté\n");
  }

  // Whitelist pair
  const isPairWhitelisted = await kyc.isAuthorized(pairAddress);
  if (!isPairWhitelisted) {
    console.log("🔐 Whitelist de la paire...");
    const whitelistPairTx = await kyc.whitelist(pairAddress);
    console.log("   TX:", whitelistPairTx.hash);
    await whitelistPairTx.wait();
    console.log("✅ Paire whitelistée\n");
  } else {
    console.log("✅ Paire déjà whitelistée\n");
  }

  // Amounts for liquidity (increased to meet DEX minimums)
  const tokenAmount = ethers.parseEther("50"); // 50 RES
  const maticAmount = ethers.parseEther("0.05"); // 0.05 MATIC

  console.log("💧 Liquidité à ajouter:");
  console.log("  ", ethers.formatEther(tokenAmount), "RES");
  console.log("  ", ethers.formatEther(maticAmount), "MATIC\n");

  // Approve router
  console.log("✍️  Approval du router...");
  const approveTx = await token.approve(DONASWAP_ROUTER, tokenAmount);
  console.log("   TX:", approveTx.hash);
  await approveTx.wait();
  console.log("✅ Approuvé\n");

  // Add liquidity
  console.log("🏊 Ajout de liquidité...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const liquidityTx = await router.addLiquidityETH(
    TOKEN_ADDRESS,
    tokenAmount,
    0, // amountTokenMin
    0, // amountETHMin
    wallet.address,
    deadline,
    { value: maticAmount }
  );

  console.log("   TX:", liquidityTx.hash);
  const receipt = await liquidityTx.wait();
  console.log("✅ Liquidité ajoutée! Block:", receipt.blockNumber, "\n");

  // Test swap quote
  console.log("📊 Prix actuel (quote):");
  try {
    const path = [WMATIC, TOKEN_ADDRESS];
    const amountsOut = await router.getAmountsOut(ethers.parseEther("1"), path);
    console.log("   1 MATIC =", ethers.formatEther(amountsOut[1]), "RES\n");
  } catch (error) {
    console.log("   ⚠️  Quote impossible\n");
  }

  // Save pool info
  const poolInfo = {
    network: "amoy",
    timestamp: new Date().toISOString(),
    pair: pairAddress,
    router: DONASWAP_ROUTER,
    factory: DONASWAP_FACTORY,
    token: TOKEN_ADDRESS,
    wmatic: WMATIC,
    initialLiquidity: {
      tokens: ethers.formatEther(tokenAmount),
      matic: ethers.formatEther(maticAmount)
    },
    transactions: {
      createPair: pairAddress !== ethers.ZeroAddress ? "Already existed" : "Created",
      addLiquidity: liquidityTx.hash
    }
  };

  const poolFile = path.join(deploymentsDir, `pool-amoy-${Date.now()}.json`);
  fs.writeFileSync(poolFile, JSON.stringify(poolInfo, null, 2));

  console.log("=" .repeat(60));
  console.log("✅ POOL DEX SETUP TERMINÉ!");
  console.log("=" .repeat(60));
  console.log("\n📋 INFORMATIONS:");
  console.log("  Paire:", pairAddress);
  console.log("  Router:", QUICKSWAP_ROUTER);
  console.log("  Liquidité: 100 RES + 0.1 MATIC");
  console.log("\n💾 Sauvegardé dans:", poolFile);
  console.log("\n🎉 Les tokens RES sont maintenant tradables sur QuickSwap!");
  console.log("\n💡 Prochaine étape: Créer l'oracle et l'indexer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });
