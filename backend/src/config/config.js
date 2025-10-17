require('dotenv').config();

const config = {
  // Blockchain
  blockchain: {
    chainName: process.env.CHAIN_NAME || 'polygon-amoy',
    chainId: parseInt(process.env.CHAIN_ID) || 80002,
    rpcUrl: process.env.RPC_URL || 'https://rpc-amoy.polygon.technology',
    wsUrl: process.env.RPC_WEBSOCKET_URL,
    startBlock: parseInt(process.env.START_BLOCK) || 0,
  },

  // Smart Contracts - Real Estate Platform
  contracts: {
    resToken: process.env.RES_TOKEN_ADDRESS,
    propertyNFT: process.env.PROPERTY_NFT_ADDRESS,
    kycRegistry: process.env.KYC_REGISTRY_ADDRESS,
    uniswapFactory: process.env.UNISWAP_FACTORY_ADDRESS,
    resMaticPair: process.env.RES_MATIC_PAIR_ADDRESS,
    priceOracle: process.env.PRICE_ORACLE_ADDRESS,
  },

  // Oracle
  oracle: {
    privateKey: process.env.ORACLE_PRIVATE_KEY,
    updateInterval: parseInt(process.env.PRICE_UPDATE_INTERVAL) || 600000, // 10 min
    priceApiUrl: process.env.PRICE_API_URL,
    priceApiKey: process.env.PRICE_API_KEY,
    useMockPrice: process.env.USE_MOCK_PRICE === 'true',
    mockPriceUsd: parseFloat(process.env.MOCK_PRICE_USD) || 100,
  },

  // Database (PostgreSQL)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'real_estate_indexer',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    // For Railway/Render deployment
    url: process.env.DATABASE_URL, // Railway provides this
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
    },
  },

  // API Server
  server: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  },

  // Indexer
  indexer: {
    syncInterval: parseInt(process.env.SYNC_INTERVAL) || 30000, // 30 seconds
    batchSize: parseInt(process.env.BATCH_SIZE) || 1000,
    batchDelay: parseInt(process.env.BATCH_DELAY) || 500,
    enableRealtimeSync: process.env.ENABLE_REALTIME_SYNC !== 'false',
  },

  // Notifications
  notifications: {
    discordWebhook: process.env.DISCORD_WEBHOOK_URL,
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/backend.log',
  },
};

// Validation
function validateConfig() {
  const required = [
    'blockchain.rpcUrl',
    'contracts.resToken',
    'contracts.propertyNFT',
    'contracts.kycRegistry',
  ];

  const missing = [];

  for (const key of required) {
    const keys = key.split('.');
    let value = config;
    for (const k of keys) {
      value = value[k];
    }
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn('⚠️  Missing required config:', missing.join(', '));
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required config: ${missing.join(', ')}`);
    }
  }
}

// Validate on startup
validateConfig();

module.exports = config;
