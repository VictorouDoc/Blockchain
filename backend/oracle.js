/**
 * Simple Oracle Service - Fetches XRP/USD price from CoinGecko API
 * Updates price every 60 seconds and exposes via HTTP endpoint
 */

import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Price cache
let priceCache = {
  xrpUsd: 0,
  lastUpdate: null,
  source: 'CoinGecko API'
};

/**
 * Fetch XRP/USD price from CoinGecko
 */
async function fetchXRPPrice() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd'
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data.ripple?.usd;

    if (!price) {
      throw new Error('Invalid price data from CoinGecko');
    }

    priceCache = {
      xrpUsd: price,
      lastUpdate: new Date().toISOString(),
      source: 'CoinGecko API'
    };

    console.log(`[Oracle] XRP/USD price updated: $${price} at ${priceCache.lastUpdate}`);
    return price;

  } catch (error) {
    console.error('[Oracle] Error fetching XRP price:', error.message);
    return null;
  }
}

/**
 * Calculate Real Estate Token price in USD
 * Based on property value and XRP price
 *
 * 💡 POUR MODIFIER LE PRIX RES:
 * - Change propertyValueUSD (ex: 750000 pour $750,000)
 * - Change totalShares (ex: 2000 pour 2000 tokens)
 * - Prix RES = propertyValueUSD / totalShares
 */
function calculateRESPrice() {
  const propertyValueUSD = 500000; // $500,000 property (change ici pour modifier)
  const totalShares = 1000; // 1000 RES tokens (change ici pour modifier)
  const pricePerToken = propertyValueUSD / totalShares; // $500 per RES

  return {
    usd: pricePerToken,
    xrp: priceCache.xrpUsd > 0 ? pricePerToken / priceCache.xrpUsd : 0
  };
}

// API Routes

/**
 * GET /api/price/xrp
 * Returns current XRP/USD price
 */
app.get('/api/price/xrp', (req, res) => {
  res.json({
    success: true,
    data: priceCache
  });
});

/**
 * GET /api/price/res
 * Returns Real Estate Token price
 */
app.get('/api/price/res', (req, res) => {
  const resPrice = calculateRESPrice();

  res.json({
    success: true,
    data: {
      symbol: 'RES',
      name: 'Real Estate Share',
      price: resPrice,
      propertyValue: 500000,
      totalShares: 1000,
      lastUpdate: priceCache.lastUpdate
    }
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const isHealthy = priceCache.xrpUsd > 0 && priceCache.lastUpdate !== null;

  res.json({
    success: true,
    status: isHealthy ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    lastPriceUpdate: priceCache.lastUpdate
  });
});

/**
 * GET /
 * Root endpoint with API documentation
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Real Estate Oracle Service',
    version: '1.0.0',
    endpoints: {
      '/api/price/xrp': 'Get XRP/USD price',
      '/api/price/res': 'Get RES token price',
      '/api/health': 'Health check'
    }
  });
});

// Start server
async function start() {
  console.log('🔮 Starting Oracle Service...\n');

  // Initial price fetch
  await fetchXRPPrice();

  // Update price every 60 seconds
  setInterval(fetchXRPPrice, 60000);

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`✅ Oracle Service running on http://localhost:${PORT}`);
    console.log(`📊 XRP Price API: http://localhost:${PORT}/api/price/xrp`);
    console.log(`🏠 RES Price API: http://localhost:${PORT}/api/price/res`);
    console.log(`💚 Health Check: http://localhost:${PORT}/api/health\n`);
  });
}

start().catch(console.error);
