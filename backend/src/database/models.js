const { query, transaction } = require('./db');
const logger = require('../utils/logger');

// ==========================================
// SYNC STATUS
// ==========================================
const syncStatus = {
  async get() {
    const result = await query('SELECT * FROM sync_status WHERE id = 1');
    return result.rows[0];
  },

  async update(blockNumber) {
    const result = await query(
      `UPDATE sync_status
       SET last_synced_block = $1,
           last_sync_timestamp = EXTRACT(EPOCH FROM NOW())::BIGINT
       WHERE id = 1
       RETURNING *`,
      [blockNumber]
    );
    return result.rows[0];
  },

  async setSyncing(isSyncing) {
    await query('UPDATE sync_status SET is_syncing = $1 WHERE id = 1', [isSyncing]);
  },
};

// ==========================================
// BLOCKS
// ==========================================
const blocks = {
  async insert(blockNumber, blockHash, timestamp, txCount = 0) {
    const result = await query(
      `INSERT INTO blocks (block_number, block_hash, timestamp, transaction_count)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (block_number) DO NOTHING
       RETURNING *`,
      [blockNumber, blockHash, timestamp, txCount]
    );
    return result.rows[0];
  },

  async getLatest(limit = 10) {
    const result = await query(
      'SELECT * FROM blocks ORDER BY block_number DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  },
};

// ==========================================
// RES TOKEN TRANSFERS
// ==========================================
const resTransfers = {
  async insert(transfer) {
    const result = await query(
      `INSERT INTO res_transfers
       (transaction_hash, block_number, log_index, from_address, to_address, amount, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (transaction_hash, log_index) DO NOTHING
       RETURNING *`,
      [
        transfer.transactionHash,
        transfer.blockNumber,
        transfer.logIndex,
        transfer.from.toLowerCase(),
        transfer.to.toLowerCase(),
        transfer.amount,
        transfer.timestamp,
      ]
    );
    return result.rows[0];
  },

  async bulkInsert(transfers) {
    if (transfers.length === 0) return;

    return transaction(async (client) => {
      for (const t of transfers) {
        await client.query(
          `INSERT INTO res_transfers
           (transaction_hash, block_number, log_index, from_address, to_address, amount, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (transaction_hash, log_index) DO NOTHING`,
          [
            t.transactionHash,
            t.blockNumber,
            t.logIndex,
            t.from.toLowerCase(),
            t.to.toLowerCase(),
            t.amount,
            t.timestamp,
          ]
        );
      }
    });
  },

  async getByAddress(address, limit = 50, offset = 0) {
    const result = await query(
      `SELECT * FROM res_transfers
       WHERE from_address = $1 OR to_address = $1
       ORDER BY block_number DESC, log_index DESC
       LIMIT $2 OFFSET $3`,
      [address.toLowerCase(), limit, offset]
    );
    return result.rows;
  },

  async getRecent(limit = 20) {
    const result = await query(
      'SELECT * FROM res_transfers ORDER BY block_number DESC, log_index DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  },

  async getTotalByAddress(address) {
    const result = await query(
      `SELECT COUNT(*) as count FROM res_transfers
       WHERE from_address = $1 OR to_address = $1`,
      [address.toLowerCase()]
    );
    return parseInt(result.rows[0].count);
  },
};

// ==========================================
// PROPERTY NFT TRANSFERS
// ==========================================
const propertyTransfers = {
  async insert(transfer) {
    const result = await query(
      `INSERT INTO property_transfers
       (transaction_hash, block_number, log_index, from_address, to_address, token_id, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (transaction_hash, log_index) DO NOTHING
       RETURNING *`,
      [
        transfer.transactionHash,
        transfer.blockNumber,
        transfer.logIndex,
        transfer.from.toLowerCase(),
        transfer.to.toLowerCase(),
        transfer.tokenId,
        transfer.timestamp,
      ]
    );
    return result.rows[0];
  },

  async bulkInsert(transfers) {
    if (transfers.length === 0) return;

    return transaction(async (client) => {
      for (const t of transfers) {
        await client.query(
          `INSERT INTO property_transfers
           (transaction_hash, block_number, log_index, from_address, to_address, token_id, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (transaction_hash, log_index) DO NOTHING`,
          [
            t.transactionHash,
            t.blockNumber,
            t.logIndex,
            t.from.toLowerCase(),
            t.to.toLowerCase(),
            t.tokenId,
            t.timestamp,
          ]
        );
      }
    });
  },

  async getByAddress(address, limit = 50, offset = 0) {
    const result = await query(
      `SELECT * FROM property_transfers
       WHERE from_address = $1 OR to_address = $1
       ORDER BY block_number DESC
       LIMIT $2 OFFSET $3`,
      [address.toLowerCase(), limit, offset]
    );
    return result.rows;
  },

  async getByTokenId(tokenId) {
    const result = await query(
      'SELECT * FROM property_transfers WHERE token_id = $1 ORDER BY block_number DESC',
      [tokenId]
    );
    return result.rows;
  },
};

// ==========================================
// PROPERTIES (NFT METADATA)
// ==========================================
const properties = {
  async upsert(property) {
    const result = await query(
      `INSERT INTO properties
       (token_id, owner_address, metadata_uri, name, description, image_url, location, price_usd, square_meters)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (token_id) DO UPDATE SET
         owner_address = EXCLUDED.owner_address,
         metadata_uri = EXCLUDED.metadata_uri,
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         image_url = EXCLUDED.image_url,
         location = EXCLUDED.location,
         price_usd = EXCLUDED.price_usd,
         square_meters = EXCLUDED.square_meters,
         updated_at = NOW()
       RETURNING *`,
      [
        property.tokenId,
        property.owner.toLowerCase(),
        property.metadataUri,
        property.name,
        property.description,
        property.imageUrl,
        property.location,
        property.priceUsd,
        property.squareMeters,
      ]
    );
    return result.rows[0];
  },

  async getByTokenId(tokenId) {
    const result = await query('SELECT * FROM properties WHERE token_id = $1', [tokenId]);
    return result.rows[0];
  },

  async getByOwner(address) {
    const result = await query('SELECT * FROM properties WHERE owner_address = $1', [
      address.toLowerCase(),
    ]);
    return result.rows;
  },

  async getAll(limit = 100, offset = 0) {
    const result = await query(
      'SELECT * FROM properties ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  },
};

// ==========================================
// KYC EVENTS
// ==========================================
const kycEvents = {
  async insert(event) {
    const result = await query(
      `INSERT INTO kyc_events
       (transaction_hash, block_number, log_index, user_address, event_type, is_active, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (transaction_hash, log_index) DO NOTHING
       RETURNING *`,
      [
        event.transactionHash,
        event.blockNumber,
        event.logIndex,
        event.userAddress.toLowerCase(),
        event.eventType,
        event.isActive,
        event.timestamp,
      ]
    );

    // Update KYC status
    if (result.rows[0]) {
      await kycStatus.updateFromEvent(event);
    }

    return result.rows[0];
  },

  async bulkInsert(events) {
    if (events.length === 0) return;

    return transaction(async (client) => {
      for (const e of events) {
        await client.query(
          `INSERT INTO kyc_events
           (transaction_hash, block_number, log_index, user_address, event_type, is_active, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (transaction_hash, log_index) DO NOTHING`,
          [
            e.transactionHash,
            e.blockNumber,
            e.logIndex,
            e.userAddress.toLowerCase(),
            e.eventType,
            e.isActive,
            e.timestamp,
          ]
        );
      }
    });
  },
};

// ==========================================
// KYC STATUS (CURRENT STATE)
// ==========================================
const kycStatus = {
  async updateFromEvent(event) {
    const address = event.userAddress.toLowerCase();

    if (event.eventType === 'whitelisted') {
      await query(
        `INSERT INTO kyc_status (user_address, is_whitelisted, last_updated_block, last_updated_timestamp)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_address) DO UPDATE SET
           is_whitelisted = EXCLUDED.is_whitelisted,
           last_updated_block = EXCLUDED.last_updated_block,
           last_updated_timestamp = EXCLUDED.last_updated_timestamp,
           updated_at = NOW()`,
        [address, event.isActive, event.blockNumber, event.timestamp]
      );
    } else if (event.eventType === 'blacklisted') {
      await query(
        `INSERT INTO kyc_status (user_address, is_blacklisted, last_updated_block, last_updated_timestamp)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_address) DO UPDATE SET
           is_blacklisted = EXCLUDED.is_blacklisted,
           last_updated_block = EXCLUDED.last_updated_block,
           last_updated_timestamp = EXCLUDED.last_updated_timestamp,
           updated_at = NOW()`,
        [address, event.isActive, event.blockNumber, event.timestamp]
      );
    }
  },

  async get(address) {
    const result = await query('SELECT * FROM kyc_status WHERE user_address = $1', [
      address.toLowerCase(),
    ]);
    return result.rows[0] || { is_whitelisted: false, is_blacklisted: false };
  },

  async getAll(limit = 100, offset = 0) {
    const result = await query(
      'SELECT * FROM kyc_status ORDER BY updated_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  },
};

// ==========================================
// SWAP EVENTS
// ==========================================
const swapEvents = {
  async insert(swap) {
    const result = await query(
      `INSERT INTO swap_events
       (transaction_hash, block_number, log_index, pair_address, sender, to_address,
        amount0_in, amount1_in, amount0_out, amount1_out, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (transaction_hash, log_index) DO NOTHING
       RETURNING *`,
      [
        swap.transactionHash,
        swap.blockNumber,
        swap.logIndex,
        swap.pairAddress.toLowerCase(),
        swap.sender.toLowerCase(),
        swap.to.toLowerCase(),
        swap.amount0In,
        swap.amount1In,
        swap.amount0Out,
        swap.amount1Out,
        swap.timestamp,
      ]
    );
    return result.rows[0];
  },

  async bulkInsert(swaps) {
    if (swaps.length === 0) return;

    return transaction(async (client) => {
      for (const s of swaps) {
        await client.query(
          `INSERT INTO swap_events
           (transaction_hash, block_number, log_index, pair_address, sender, to_address,
            amount0_in, amount1_in, amount0_out, amount1_out, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (transaction_hash, log_index) DO NOTHING`,
          [
            s.transactionHash,
            s.blockNumber,
            s.logIndex,
            s.pairAddress.toLowerCase(),
            s.sender.toLowerCase(),
            s.to.toLowerCase(),
            s.amount0In,
            s.amount1In,
            s.amount0Out,
            s.amount1Out,
            s.timestamp,
          ]
        );
      }
    });
  },

  async getByPair(pairAddress, limit = 50, offset = 0) {
    const result = await query(
      'SELECT * FROM swap_events WHERE pair_address = $1 ORDER BY block_number DESC LIMIT $2 OFFSET $3',
      [pairAddress.toLowerCase(), limit, offset]
    );
    return result.rows;
  },

  async getRecent(limit = 20) {
    const result = await query(
      'SELECT * FROM swap_events ORDER BY block_number DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  },
};

// ==========================================
// ORACLE PRICES
// ==========================================
const oraclePrices = {
  async insert(price) {
    const result = await query(
      `INSERT INTO oracle_prices
       (transaction_hash, block_number, token_symbol, price_usd, timestamp, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        price.transactionHash || null,
        price.blockNumber || null,
        price.tokenSymbol,
        price.priceUsd,
        price.timestamp,
        price.source || 'oracle',
      ]
    );
    return result.rows[0];
  },

  async getLatest(tokenSymbol = 'RES') {
    const result = await query(
      'SELECT * FROM oracle_prices WHERE token_symbol = $1 ORDER BY timestamp DESC LIMIT 1',
      [tokenSymbol]
    );
    return result.rows[0];
  },

  async getHistory(tokenSymbol = 'RES', limit = 100) {
    const result = await query(
      'SELECT * FROM oracle_prices WHERE token_symbol = $1 ORDER BY timestamp DESC LIMIT $2',
      [tokenSymbol, limit]
    );
    return result.rows;
  },
};

// ==========================================
// NOTIFICATIONS
// ==========================================
const notifications = {
  async insert(notification) {
    const result = await query(
      `INSERT INTO notifications (type, recipient, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        notification.type,
        notification.recipient || null,
        notification.title,
        notification.message,
        notification.data ? JSON.stringify(notification.data) : null,
      ]
    );
    return result.rows[0];
  },

  async getPending(limit = 50) {
    const result = await query(
      'SELECT * FROM notifications WHERE sent = false ORDER BY created_at ASC LIMIT $1',
      [limit]
    );
    return result.rows;
  },

  async markSent(id) {
    await query('UPDATE notifications SET sent = true, sent_at = NOW() WHERE id = $1', [id]);
  },
};

// ==========================================
// DASHBOARD STATS
// ==========================================
const stats = {
  async getDashboard() {
    const result = await query('SELECT * FROM dashboard_stats');
    return result.rows[0];
  },
};

module.exports = {
  syncStatus,
  blocks,
  resTransfers,
  propertyTransfers,
  properties,
  kycEvents,
  kycStatus,
  swapEvents,
  oraclePrices,
  notifications,
  stats,
};
