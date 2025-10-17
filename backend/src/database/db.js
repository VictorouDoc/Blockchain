const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');

// Create PostgreSQL connection pool
let pool;

if (config.database.url) {
  // Railway/Render deployment - use DATABASE_URL
  pool = new Pool({
    connectionString: config.database.url,
    ssl: config.server.env === 'production' ? { rejectUnauthorized: false } : false,
  });
} else {
  // Local development
  pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    min: config.database.pool.min,
    max: config.database.pool.max,
  });
}

// Test connection
pool.on('connect', () => {
  logger.info('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err);
});

// Initialize database schema
async function initializeDatabase() {
  try {
    logger.info('Initializing database schema...');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);

    logger.info('✅ Database schema initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

// Query helper with error handling
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow query (${duration}ms): ${text}`);
    }
    return res;
  } catch (error) {
    logger.error('Database query error:', { text, params, error: error.message });
    throw error;
  }
}

// Transaction helper
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check
async function healthCheck() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
async function close() {
  try {
    await pool.end();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }
}

module.exports = {
  pool,
  query,
  transaction,
  initializeDatabase,
  healthCheck,
  close,
};
