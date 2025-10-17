const cron = require('node-cron');
const { ethers } = require('ethers');
const config = require('../config/config');
const logger = require('../utils/logger');
const eventListener = require('./eventListener');
const { syncStatus } = require('../database/models');

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncJob = null;
    this.provider = null;
  }

  // Initialize sync manager
  async initialize() {
    try {
      logger.info('Initializing sync manager...');

      // Initialize event listener first
      await eventListener.initialize();

      // Get provider from event listener
      this.provider = eventListener.provider;

      logger.info('✅ Sync manager initialized');
    } catch (error) {
      logger.error('Failed to initialize sync manager:', error);
      throw error;
    }
  }

  // Start periodic sync
  startPeriodicSync() {
    const intervalSeconds = Math.floor(config.indexer.syncInterval / 1000);
    logger.info(`Starting periodic sync every ${intervalSeconds} seconds`);

    // Run sync immediately
    this.runSync();

    // Schedule periodic sync using node-cron
    // Convert milliseconds to seconds for cron expression
    const cronExpression = `*/${intervalSeconds} * * * * *`;

    this.syncJob = cron.schedule(cronExpression, async () => {
      await this.runSync();
    });

    logger.info('✅ Periodic sync started');
  }

  // Run single sync cycle
  async runSync() {
    if (this.isSyncing) {
      logger.debug('Sync already in progress, skipping...');
      return;
    }

    try {
      this.isSyncing = true;
      await syncStatus.setSyncing(true);

      // Get current sync status from database
      const status = await syncStatus.get();
      const lastSyncedBlock = status.last_synced_block || config.blockchain.startBlock;

      // Get latest block from blockchain
      const latestBlock = await this.provider.getBlockNumber();

      // Calculate blocks to sync
      const blocksToSync = latestBlock - lastSyncedBlock;

      if (blocksToSync <= 0) {
        logger.debug('Already up to date');
        return;
      }

      logger.info(`Syncing ${blocksToSync} blocks: ${lastSyncedBlock + 1} -> ${latestBlock}`);

      // Sync events
      await eventListener.syncHistoricalEvents(lastSyncedBlock + 1, latestBlock);

      // Update sync status
      await syncStatus.update(latestBlock);

      logger.info(`✅ Sync completed. Now at block ${latestBlock}`);
    } catch (error) {
      logger.error('Error during sync:', error);
    } finally {
      this.isSyncing = false;
      await syncStatus.setSyncing(false);
    }
  }

  // Initial historical sync (one-time, for first setup)
  async initialSync() {
    try {
      logger.info('Starting initial historical sync...');

      const status = await syncStatus.get();
      const lastSyncedBlock = status.last_synced_block || config.blockchain.startBlock;
      const latestBlock = await this.provider.getBlockNumber();

      if (lastSyncedBlock >= latestBlock) {
        logger.info('Already synced to latest block');
        return;
      }

      const blocksToSync = latestBlock - lastSyncedBlock;
      logger.info(`Initial sync: ${blocksToSync} blocks to process`);

      // For large historical syncs, we might want to add progress tracking
      const startTime = Date.now();

      await eventListener.syncHistoricalEvents(lastSyncedBlock + 1, latestBlock);
      await syncStatus.update(latestBlock);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`✅ Initial sync completed in ${duration}s`);
    } catch (error) {
      logger.error('Error during initial sync:', error);
      throw error;
    }
  }

  // Get sync progress
  async getSyncProgress() {
    try {
      const status = await syncStatus.get();
      const latestBlock = await this.provider.getBlockNumber();
      const blocksToSync = latestBlock - status.last_synced_block;
      const progress = ((status.last_synced_block / latestBlock) * 100).toFixed(2);

      return {
        lastSyncedBlock: status.last_synced_block,
        latestBlock,
        blocksToSync,
        progress: `${progress}%`,
        isSyncing: status.is_syncing,
        lastSyncTimestamp: status.last_sync_timestamp,
      };
    } catch (error) {
      logger.error('Error getting sync progress:', error);
      return null;
    }
  }

  // Stop sync
  stop() {
    if (this.syncJob) {
      this.syncJob.stop();
      logger.info('Periodic sync stopped');
    }
    eventListener.stopListening();
  }

  // Start everything (convenience method)
  async start() {
    try {
      logger.info('🚀 Starting indexer...');

      // Initialize
      await this.initialize();

      // Check if we need initial sync
      const status = await syncStatus.get();
      const latestBlock = await this.provider.getBlockNumber();
      const blocksBehind = latestBlock - status.last_synced_block;

      if (blocksBehind > 100) {
        logger.info(`Behind by ${blocksBehind} blocks, running initial sync...`);
        await this.initialSync();
      }

      // Start periodic sync
      this.startPeriodicSync();

      // Start real-time listening
      eventListener.startRealtimeListening();

      logger.info('✅ Indexer started successfully');
    } catch (error) {
      logger.error('Failed to start indexer:', error);
      throw error;
    }
  }
}

module.exports = new SyncManager();
