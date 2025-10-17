-- Real Estate Tokenization Platform Database Schema
-- PostgreSQL 12+

-- ==========================================
-- SYNC STATUS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS sync_status (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_synced_block BIGINT NOT NULL DEFAULT 0,
    last_sync_timestamp BIGINT NOT NULL DEFAULT 0,
    is_syncing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert initial sync status
INSERT INTO sync_status (id, last_synced_block, last_sync_timestamp)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- BLOCKS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS blocks (
    block_number BIGINT PRIMARY KEY,
    block_hash TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp);

-- ==========================================
-- RES TOKEN TRANSFERS (ERC-20)
-- ==========================================
CREATE TABLE IF NOT EXISTS res_transfers (
    id SERIAL PRIMARY KEY,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount TEXT NOT NULL, -- Store as string to avoid precision loss
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(transaction_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_res_from ON res_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_res_to ON res_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_res_block ON res_transfers(block_number);
CREATE INDEX IF NOT EXISTS idx_res_timestamp ON res_transfers(timestamp DESC);

-- ==========================================
-- PROPERTY NFT TRANSFERS (ERC-721)
-- ==========================================
CREATE TABLE IF NOT EXISTS property_transfers (
    id SERIAL PRIMARY KEY,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    token_id TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(transaction_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_property_from ON property_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_property_to ON property_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_property_token_id ON property_transfers(token_id);
CREATE INDEX IF NOT EXISTS idx_property_block ON property_transfers(block_number);

-- ==========================================
-- PROPERTY NFT METADATA
-- ==========================================
CREATE TABLE IF NOT EXISTS properties (
    token_id TEXT PRIMARY KEY,
    owner_address TEXT NOT NULL,
    metadata_uri TEXT,
    name TEXT,
    description TEXT,
    image_url TEXT,
    location TEXT,
    price_usd TEXT,
    square_meters INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_address);

-- ==========================================
-- KYC REGISTRY EVENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS kyc_events (
    id SERIAL PRIMARY KEY,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER NOT NULL,
    user_address TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'whitelisted' or 'blacklisted'
    is_active BOOLEAN NOT NULL, -- true = added, false = removed
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(transaction_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_events(user_address);
CREATE INDEX IF NOT EXISTS idx_kyc_type ON kyc_events(event_type);
CREATE INDEX IF NOT EXISTS idx_kyc_block ON kyc_events(block_number);

-- ==========================================
-- KYC STATUS (CURRENT STATE)
-- ==========================================
CREATE TABLE IF NOT EXISTS kyc_status (
    user_address TEXT PRIMARY KEY,
    is_whitelisted BOOLEAN NOT NULL DEFAULT false,
    is_blacklisted BOOLEAN NOT NULL DEFAULT false,
    last_updated_block BIGINT NOT NULL,
    last_updated_timestamp BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_status_whitelist ON kyc_status(is_whitelisted);
CREATE INDEX IF NOT EXISTS idx_kyc_status_blacklist ON kyc_status(is_blacklisted);

-- ==========================================
-- DEX SWAP EVENTS (Uniswap V2)
-- ==========================================
CREATE TABLE IF NOT EXISTS swap_events (
    id SERIAL PRIMARY KEY,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER NOT NULL,
    pair_address TEXT NOT NULL,
    sender TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount0_in TEXT NOT NULL,
    amount1_in TEXT NOT NULL,
    amount0_out TEXT NOT NULL,
    amount1_out TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(transaction_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_swap_pair ON swap_events(pair_address);
CREATE INDEX IF NOT EXISTS idx_swap_sender ON swap_events(sender);
CREATE INDEX IF NOT EXISTS idx_swap_block ON swap_events(block_number);
CREATE INDEX IF NOT EXISTS idx_swap_timestamp ON swap_events(timestamp DESC);

-- ==========================================
-- ORACLE PRICE UPDATES
-- ==========================================
CREATE TABLE IF NOT EXISTS oracle_prices (
    id SERIAL PRIMARY KEY,
    transaction_hash TEXT,
    block_number BIGINT,
    token_symbol TEXT NOT NULL, -- 'RES'
    price_usd TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    source TEXT NOT NULL DEFAULT 'oracle', -- 'oracle' or 'api'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oracle_symbol ON oracle_prices(token_symbol);
CREATE INDEX IF NOT EXISTS idx_oracle_timestamp ON oracle_prices(timestamp DESC);

-- ==========================================
-- NOTIFICATIONS QUEUE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'transfer', 'swap', 'kyc', 'property_mint'
    recipient TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    sent BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ==========================================
-- STATISTICS VIEW (for dashboard)
-- ==========================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM res_transfers) as total_res_transfers,
    (SELECT COUNT(*) FROM property_transfers) as total_property_transfers,
    (SELECT COUNT(*) FROM properties) as total_properties,
    (SELECT COUNT(*) FROM kyc_status WHERE is_whitelisted = true) as whitelisted_users,
    (SELECT COUNT(*) FROM kyc_status WHERE is_blacklisted = true) as blacklisted_users,
    (SELECT COUNT(*) FROM swap_events) as total_swaps,
    (SELECT last_synced_block FROM sync_status WHERE id = 1) as last_synced_block,
    (SELECT price_usd FROM oracle_prices WHERE token_symbol = 'RES' ORDER BY timestamp DESC LIMIT 1) as current_res_price;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to update sync status timestamp
CREATE OR REPLACE FUNCTION update_sync_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_status_updated
    BEFORE UPDATE ON sync_status
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_timestamp();

-- Function to update property owner
CREATE OR REPLACE FUNCTION update_property_owner()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE properties
    SET owner_address = NEW.to_address,
        updated_at = NOW()
    WHERE token_id = NEW.token_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_transfer_update_owner
    AFTER INSERT ON property_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_property_owner();
