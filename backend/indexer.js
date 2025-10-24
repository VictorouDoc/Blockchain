/**
 * Blockchain Indexer - Syncs on-chain events to backend
 * Monitors KYCRegistry, RealEstateToken, and PropertyNFT events
 */

import { ethers } from 'ethers';
import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = 3002;

// In-memory database (for simplicity - use real DB in production)
const database = {
  kycEvents: [],
  transfers: [],
  nftMints: [],
  lastSyncedBlock: 0
};

// Load deployment info
function loadDeployment() {
  const deploymentsDir = path.join(__dirname, '..', 'blockchain', 'deployments');

  // Try to load sepolia-latest.json first, fallback to latest sepolia deployment
  const latestPath = path.join(deploymentsDir, 'sepolia-latest.json');
  if (fs.existsSync(latestPath)) {
    return JSON.parse(fs.readFileSync(latestPath, 'utf8'));
  }

  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith('sepolia'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No Sepolia deployment found');
  }

  return JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, files[0]), 'utf8')
  );
}

// Setup provider and contracts
async function setupContracts() {
  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
  );

  const deployment = loadDeployment();

  // Load ABIs
  const kycABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'blockchain', 'artifacts', 'contracts', 'KYCRegistry.sol', 'KYCRegistry.json'), 'utf8')
  ).abi;

  const tokenABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'blockchain', 'artifacts', 'contracts', 'RealEstateToken.sol', 'RealEstateToken.json'), 'utf8')
  ).abi;

  // Create contract instances
  const kycRegistry = new ethers.Contract(
    deployment.contracts.KYCRegistry,
    kycABI,
    provider
  );

  const realEstateToken = new ethers.Contract(
    deployment.contracts.RealEstateToken,
    tokenABI,
    provider
  );

  return { provider, kycRegistry, realEstateToken, deployment };
}

/**
 * Index KYC events (Whitelisted, Blacklisted)
 */
async function indexKYCEvents(kycRegistry, fromBlock, toBlock) {
  console.log(`[Indexer] Scanning KYC events from block ${fromBlock} to ${toBlock}...`);

  // Get Whitelisted events
  const whitelistedFilter = kycRegistry.filters.Whitelisted();
  const whitelistedEvents = await kycRegistry.queryFilter(whitelistedFilter, fromBlock, toBlock);

  for (const event of whitelistedEvents) {
    const eventData = {
      type: 'Whitelisted',
      address: event.args.account,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: new Date().toISOString()
    };

    database.kycEvents.push(eventData);
    console.log(`  ✅ Whitelisted: ${event.args.account}`);
  }

  // Get Blacklisted events
  const blacklistedFilter = kycRegistry.filters.Blacklisted();
  const blacklistedEvents = await kycRegistry.queryFilter(blacklistedFilter, fromBlock, toBlock);

  for (const event of blacklistedEvents) {
    const eventData = {
      type: 'Blacklisted',
      address: event.args.account,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: new Date().toISOString()
    };

    database.kycEvents.push(eventData);
    console.log(`  ❌ Blacklisted: ${event.args.account}`);
  }

  return whitelistedEvents.length + blacklistedEvents.length;
}

/**
 * Index RealEstateToken Transfer events
 */
async function indexTransferEvents(token, fromBlock, toBlock) {
  console.log(`[Indexer] Scanning Transfer events from block ${fromBlock} to ${toBlock}...`);

  const transferFilter = token.filters.Transfer();
  const transferEvents = await token.queryFilter(transferFilter, fromBlock, toBlock);

  for (const event of transferEvents) {
    const eventData = {
      from: event.args.from,
      to: event.args.to,
      value: ethers.formatEther(event.args.value),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: new Date().toISOString()
    };

    database.transfers.push(eventData);
    console.log(`  💸 Transfer: ${eventData.value} RES from ${eventData.from.slice(0, 10)}... to ${eventData.to.slice(0, 10)}...`);
  }

  return transferEvents.length;
}

/**
 * Sync blockchain events
 */
async function syncBlockchain() {
  try {
    const { provider, kycRegistry, realEstateToken } = await setupContracts();

    const currentBlock = await provider.getBlockNumber();
    const fromBlock = database.lastSyncedBlock || currentBlock - 1000; // Last 1000 blocks on first run

    console.log(`\n🔄 Syncing blocks ${fromBlock} to ${currentBlock}...`);

    // Index KYC events
    const kycEventsCount = await indexKYCEvents(kycRegistry, fromBlock, currentBlock);

    // Index Transfer events
    const transfersCount = await indexTransferEvents(realEstateToken, fromBlock, currentBlock);

    database.lastSyncedBlock = currentBlock;

    console.log(`✅ Sync complete: ${kycEventsCount} KYC events, ${transfersCount} transfers\n`);

  } catch (error) {
    console.error('[Indexer] Sync error:', error.message);
  }
}

// API Routes

/**
 * GET /api/events/kyc
 * Returns all KYC events
 */
app.get('/api/events/kyc', (req, res) => {
  res.json({
    success: true,
    count: database.kycEvents.length,
    data: database.kycEvents.slice(-50) // Last 50 events
  });
});

/**
 * GET /api/events/transfers
 * Returns all transfer events
 */
app.get('/api/events/transfers', (req, res) => {
  res.json({
    success: true,
    count: database.transfers.length,
    data: database.transfers.slice(-50) // Last 50 transfers
  });
});

/**
 * GET /api/stats
 * Returns blockchain statistics
 */
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      lastSyncedBlock: database.lastSyncedBlock,
      totalKYCEvents: database.kycEvents.length,
      totalTransfers: database.transfers.length,
      whitelisted: database.kycEvents.filter(e => e.type === 'Whitelisted').length,
      blacklisted: database.kycEvents.filter(e => e.type === 'Blacklisted').length
    }
  });
});

/**
 * GET /api/health
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    lastSync: database.lastSyncedBlock
  });
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Blockchain Indexer Service',
    version: '1.0.0',
    endpoints: {
      '/api/events/kyc': 'Get KYC events',
      '/api/events/transfers': 'Get transfer events',
      '/api/stats': 'Get blockchain stats',
      '/api/health': 'Health check'
    }
  });
});

// Start service
async function start() {
  console.log('📡 Starting Blockchain Indexer...\n');

  // Initial sync
  await syncBlockchain();

  // Sync every 60 seconds
  setInterval(syncBlockchain, 60000);

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`✅ Indexer Service running on http://localhost:${PORT}`);
    console.log(`📊 KYC Events: http://localhost:${PORT}/api/events/kyc`);
    console.log(`💸 Transfers: http://localhost:${PORT}/api/events/transfers`);
    console.log(`📈 Stats: http://localhost:${PORT}/api/stats\n`);
  });
}

start().catch(console.error);

export {
  loadDeployment,
  setupContracts,
  indexKYCEvents,
  indexTransferEvents,
  syncBlockchain,
  app,
  database
};
