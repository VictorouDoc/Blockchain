const { ethers } = require('ethers');
const config = require('../config/config');
const logger = require('../utils/logger');
const {
  RES_TOKEN_ABI,
  PROPERTY_NFT_ABI,
  KYC_REGISTRY_ABI,
  UNISWAP_V2_PAIR_ABI,
  PRICE_ORACLE_ABI,
} = require('../config/abis');
const {
  resTransfers,
  propertyTransfers,
  kycEvents,
  swapEvents,
  oraclePrices,
  blocks,
  notifications,
} = require('../database/models');

class EventListener {
  constructor() {
    this.provider = null;
    this.contracts = {};
    this.isListening = false;
  }

  // Initialize provider and contracts
  async initialize() {
    try {
      logger.info('Initializing event listener...');

      // Create provider
      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

      // Test connection
      const network = await this.provider.getNetwork();
      logger.info(`Connected to network: ${network.name} (chainId: ${network.chainId})`);

      // Initialize contracts
      this.contracts.resToken = new ethers.Contract(
        config.contracts.resToken,
        RES_TOKEN_ABI,
        this.provider
      );

      this.contracts.propertyNFT = new ethers.Contract(
        config.contracts.propertyNFT,
        PROPERTY_NFT_ABI,
        this.provider
      );

      this.contracts.kycRegistry = new ethers.Contract(
        config.contracts.kycRegistry,
        KYC_REGISTRY_ABI,
        this.provider
      );

      if (config.contracts.resMaticPair) {
        this.contracts.uniswapPair = new ethers.Contract(
          config.contracts.resMaticPair,
          UNISWAP_V2_PAIR_ABI,
          this.provider
        );
      }

      if (config.contracts.priceOracle) {
        this.contracts.priceOracle = new ethers.Contract(
          config.contracts.priceOracle,
          PRICE_ORACLE_ABI,
          this.provider
        );
      }

      logger.info('✅ Event listener initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize event listener:', error);
      throw error;
    }
  }

  // Fetch historical events in batches
  async syncHistoricalEvents(fromBlock, toBlock) {
    try {
      logger.info(`Syncing events from block ${fromBlock} to ${toBlock}`);

      const batchSize = config.indexer.batchSize;
      let currentBlock = fromBlock;

      while (currentBlock <= toBlock) {
        const endBlock = Math.min(currentBlock + batchSize - 1, toBlock);

        logger.info(`Processing batch: ${currentBlock} -> ${endBlock}`);

        // Fetch all events in parallel
        await Promise.all([
          this.fetchResTransferEvents(currentBlock, endBlock),
          this.fetchPropertyTransferEvents(currentBlock, endBlock),
          this.fetchPropertyMintEvents(currentBlock, endBlock),
          this.fetchKYCEvents(currentBlock, endBlock),
          this.fetchSwapEvents(currentBlock, endBlock),
          this.fetchOraclePriceEvents(currentBlock, endBlock),
        ]);

        currentBlock = endBlock + 1;

        // Delay to avoid rate limits
        if (currentBlock <= toBlock) {
          await this.sleep(config.indexer.batchDelay);
        }
      }

      logger.info(`✅ Historical sync completed: ${fromBlock} -> ${toBlock}`);
    } catch (error) {
      logger.error('Error syncing historical events:', error);
      throw error;
    }
  }

  // Fetch RES token Transfer events
  async fetchResTransferEvents(fromBlock, toBlock) {
    try {
      const filter = this.contracts.resToken.filters.Transfer();
      const events = await this.contracts.resToken.queryFilter(filter, fromBlock, toBlock);

      if (events.length === 0) return;

      logger.info(`Found ${events.length} RES Transfer events`);

      const transfers = await Promise.all(
        events.map(async (event) => {
          const block = await event.getBlock();
          return {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.index,
            from: event.args.from,
            to: event.args.to,
            amount: event.args.value.toString(),
            timestamp: block.timestamp,
          };
        })
      );

      await resTransfers.bulkInsert(transfers);

      // Create notifications for large transfers
      for (const transfer of transfers) {
        const amountInTokens = Number(ethers.formatEther(transfer.amount));
        if (amountInTokens > 1000) {
          await notifications.insert({
            type: 'transfer',
            title: 'Large RES Transfer',
            message: `${amountInTokens.toFixed(2)} RES transferred from ${transfer.from.substring(0, 10)}... to ${transfer.to.substring(0, 10)}...`,
            data: { transactionHash: transfer.transactionHash },
          });
        }
      }
    } catch (error) {
      logger.error('Error fetching RES Transfer events:', error);
    }
  }

  // Fetch PropertyNFT Transfer events
  async fetchPropertyTransferEvents(fromBlock, toBlock) {
    try {
      const filter = this.contracts.propertyNFT.filters.Transfer();
      const events = await this.contracts.propertyNFT.queryFilter(filter, fromBlock, toBlock);

      if (events.length === 0) return;

      logger.info(`Found ${events.length} Property Transfer events`);

      const transfers = await Promise.all(
        events.map(async (event) => {
          const block = await event.getBlock();
          return {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.index,
            from: event.args.from,
            to: event.args.to,
            tokenId: event.args.tokenId.toString(),
            timestamp: block.timestamp,
          };
        })
      );

      await propertyTransfers.bulkInsert(transfers);

      // Notifications for NFT transfers (excluding mints from zero address)
      for (const transfer of transfers) {
        if (transfer.from !== ethers.ZeroAddress) {
          await notifications.insert({
            type: 'property_transfer',
            title: 'Property NFT Transferred',
            message: `Property #${transfer.tokenId} transferred to ${transfer.to.substring(0, 10)}...`,
            data: { transactionHash: transfer.transactionHash, tokenId: transfer.tokenId },
          });
        }
      }
    } catch (error) {
      logger.error('Error fetching Property Transfer events:', error);
    }
  }

  // Fetch PropertyMinted events (if you have this custom event)
  async fetchPropertyMintEvents(fromBlock, toBlock) {
    try {
      const filter = this.contracts.propertyNFT.filters.PropertyMinted();
      const events = await this.contracts.propertyNFT.queryFilter(filter, fromBlock, toBlock);

      if (events.length === 0) return;

      logger.info(`Found ${events.length} PropertyMinted events`);

      // Handle property metadata (you might want to fetch from IPFS/URI)
      for (const event of events) {
        const tokenId = event.args.tokenId.toString();
        const owner = event.args.owner;
        const metadataURI = event.args.metadataURI;

        // You can fetch and parse metadata here
        // For now, just store basic info
        await notifications.insert({
          type: 'property_mint',
          title: 'New Property Minted',
          message: `Property #${tokenId} has been minted`,
          data: { tokenId, owner, metadataURI },
        });
      }
    } catch (error) {
      // This event might not exist in your contract, so just log and continue
      logger.debug('PropertyMinted event not found (this is OK if not implemented)');
    }
  }

  // Fetch KYC events
  async fetchKYCEvents(fromBlock, toBlock) {
    try {
      const filters = [
        { name: 'AddressWhitelisted', type: 'whitelisted', isActive: true },
        { name: 'AddressRemovedFromWhitelist', type: 'whitelisted', isActive: false },
        { name: 'AddressBlacklisted', type: 'blacklisted', isActive: true },
        { name: 'AddressRemovedFromBlacklist', type: 'blacklisted', isActive: false },
      ];

      for (const filterConfig of filters) {
        const filter = this.contracts.kycRegistry.filters[filterConfig.name]();
        const events = await this.contracts.kycRegistry.queryFilter(
          filter,
          fromBlock,
          toBlock
        );

        if (events.length === 0) continue;

        logger.info(`Found ${events.length} ${filterConfig.name} events`);

        const kycEventsList = await Promise.all(
          events.map(async (event) => {
            const block = await event.getBlock();
            return {
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
              logIndex: event.index,
              userAddress: event.args.user,
              eventType: filterConfig.type,
              isActive: filterConfig.isActive,
              timestamp: block.timestamp,
            };
          })
        );

        await kycEvents.bulkInsert(kycEventsList);

        // Notifications
        for (const kycEvent of kycEventsList) {
          await notifications.insert({
            type: 'kyc',
            title: `User ${filterConfig.isActive ? 'Added to' : 'Removed from'} ${filterConfig.type === 'whitelisted' ? 'Whitelist' : 'Blacklist'}`,
            message: `Address ${kycEvent.userAddress.substring(0, 10)}... was ${filterConfig.isActive ? 'added to' : 'removed from'} the ${filterConfig.type === 'whitelisted' ? 'whitelist' : 'blacklist'}`,
            data: { address: kycEvent.userAddress },
          });
        }
      }
    } catch (error) {
      logger.error('Error fetching KYC events:', error);
    }
  }

  // Fetch Uniswap Swap events
  async fetchSwapEvents(fromBlock, toBlock) {
    if (!this.contracts.uniswapPair) return;

    try {
      const filter = this.contracts.uniswapPair.filters.Swap();
      const events = await this.contracts.uniswapPair.queryFilter(filter, fromBlock, toBlock);

      if (events.length === 0) return;

      logger.info(`Found ${events.length} Swap events`);

      const swaps = await Promise.all(
        events.map(async (event) => {
          const block = await event.getBlock();
          return {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.index,
            pairAddress: config.contracts.resMaticPair,
            sender: event.args.sender,
            to: event.args.to,
            amount0In: event.args.amount0In.toString(),
            amount1In: event.args.amount1In.toString(),
            amount0Out: event.args.amount0Out.toString(),
            amount1Out: event.args.amount1Out.toString(),
            timestamp: block.timestamp,
          };
        })
      );

      await swapEvents.bulkInsert(swaps);

      // Notifications for large swaps
      for (const swap of swaps) {
        await notifications.insert({
          type: 'swap',
          title: 'DEX Swap Executed',
          message: `Swap executed on RES/MATIC pair`,
          data: { transactionHash: swap.transactionHash },
        });
      }
    } catch (error) {
      logger.error('Error fetching Swap events:', error);
    }
  }

  // Fetch Oracle PriceUpdated events
  async fetchOraclePriceEvents(fromBlock, toBlock) {
    if (!this.contracts.priceOracle) return;

    try {
      const filter = this.contracts.priceOracle.filters.PriceUpdated();
      const events = await this.contracts.priceOracle.queryFilter(filter, fromBlock, toBlock);

      if (events.length === 0) return;

      logger.info(`Found ${events.length} PriceUpdated events`);

      for (const event of events) {
        const block = await event.getBlock();
        await oraclePrices.insert({
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          tokenSymbol: 'RES',
          priceUsd: event.args.price.toString(),
          timestamp: block.timestamp,
          source: 'oracle',
        });
      }
    } catch (error) {
      logger.error('Error fetching Oracle price events:', error);
    }
  }

  // Start real-time event listening (WebSocket)
  startRealtimeListening() {
    if (!config.indexer.enableRealtimeSync) {
      logger.info('Real-time sync is disabled');
      return;
    }

    logger.info('Starting real-time event listening...');
    this.isListening = true;

    // Listen to RES transfers
    this.contracts.resToken.on('Transfer', async (from, to, amount, event) => {
      logger.info(`🔔 New RES Transfer: ${ethers.formatEther(amount)} RES`);
      await this.handleRealtimeEvent('resTransfer', event);
    });

    // Listen to Property transfers
    this.contracts.propertyNFT.on('Transfer', async (from, to, tokenId, event) => {
      logger.info(`🔔 New Property Transfer: Token #${tokenId}`);
      await this.handleRealtimeEvent('propertyTransfer', event);
    });

    // Listen to KYC events
    this.contracts.kycRegistry.on('AddressWhitelisted', async (user, timestamp, event) => {
      logger.info(`🔔 Address Whitelisted: ${user}`);
      await this.handleRealtimeEvent('kycWhitelisted', event);
    });

    // Add more real-time listeners as needed...

    logger.info('✅ Real-time listening started');
  }

  // Handle real-time event
  async handleRealtimeEvent(eventType, event) {
    try {
      // Process event immediately (you can add specific handlers here)
      logger.debug(`Processing real-time ${eventType} event`);
    } catch (error) {
      logger.error(`Error handling real-time event ${eventType}:`, error);
    }
  }

  // Stop listening
  stopListening() {
    if (this.isListening) {
      this.contracts.resToken.removeAllListeners();
      this.contracts.propertyNFT.removeAllListeners();
      this.contracts.kycRegistry.removeAllListeners();
      this.isListening = false;
      logger.info('Stopped real-time listening');
    }
  }

  // Helper: Sleep function
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new EventListener();
