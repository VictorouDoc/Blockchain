/**
 * __tests__/oracle.test.js
 *
 * Tests for oracle.js
 */

import request from 'supertest';
import { jest } from '@jest/globals';

jest.useRealTimers();

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());
import fetch from 'node-fetch';

import {
  app,
  fetchXRPPrice,
  calculateRESPrice,
  priceCache as priceCacheRef // we will read/write this to assert updates
} from '../oracle.js';

describe('Oracle Service - unit tests', () => {
  beforeEach(() => {
    // reset priceCache to known state
    priceCacheRef.xrpUsd = 0;
    priceCacheRef.lastUpdate = null;
    priceCacheRef.source = 'CoinGecko API';
    jest.clearAllMocks();
  });

  test('fetchXRPPrice returns numeric price and updates priceCache on success', async () => {
    // mock successful fetch
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ripple: { usd: 0.42 } })
    });

    const price = await fetchXRPPrice();
    expect(price).toBe(0.42);
    expect(priceCacheRef.xrpUsd).toBe(0.42);
    expect(priceCacheRef.lastUpdate).not.toBeNull();
    expect(priceCacheRef.source).toBe('CoinGecko API');
  });

  test('fetchXRPPrice handles non-200 responses', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 });

    const price = await fetchXRPPrice();
    expect(price).toBeNull();
    expect(priceCacheRef.xrpUsd).toBe(0);
    expect(priceCacheRef.lastUpdate).toBeNull();
  });

  test('fetchXRPPrice handles invalid JSON / missing keys', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ not_ripple: {} })
    });

    const price = await fetchXRPPrice();
    expect(price).toBeNull();
    expect(priceCacheRef.xrpUsd).toBe(0);
    expect(priceCacheRef.lastUpdate).toBeNull();
  });

  test('calculateRESPrice returns USD price and xrp = 0 when priceCache.xrpUsd === 0', () => {
    priceCacheRef.xrpUsd = 0;
    const resPrice = calculateRESPrice();
    expect(resPrice.usd).toBe(500); // 500000 / 1000
    expect(resPrice.xrp).toBe(0);
  });

  test('calculateRESPrice returns xrp when priceCache.xrpUsd > 0', () => {
    priceCacheRef.xrpUsd = 2; // example: $2 per XRP
    const resPrice = calculateRESPrice();
    expect(resPrice.usd).toBe(500);
    expect(resPrice.xrp).toBeCloseTo(250); // 500 / 2 = 250 XRP
  });

  // Express endpoints using supertest
  test('GET /api/price/xrp returns priceCache structure', async () => {
    priceCacheRef.xrpUsd = 1.23;
    priceCacheRef.lastUpdate = new Date().toISOString();

    const res = await request(app).get('/api/price/xrp');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.xrpUsd).toBe(1.23);
  });

  test('GET /api/price/res returns RES price payload', async () => {
    priceCacheRef.xrpUsd = 5; // to compute xrp component
    priceCacheRef.lastUpdate = new Date().toISOString();

    const res = await request(app).get('/api/price/res');
    expect(res.status).toBe(200);
    expect(res.body.data.symbol).toBe('RES');
    expect(res.body.data.price.usd).toBe(500);
    expect(res.body.data.price.xrp).toBeCloseTo(100); // 500/5
    expect(res.body.data.lastUpdate).toBe(priceCacheRef.lastUpdate);
  });

  test('GET /api/health returns healthy when priceCache populated', async () => {
    priceCacheRef.xrpUsd = 0.9;
    priceCacheRef.lastUpdate = new Date().toISOString();

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.lastPriceUpdate).toBe(priceCacheRef.lastUpdate);
  });

  test('GET /api/health returns degraded when priceCache empty', async () => {
    priceCacheRef.xrpUsd = 0;
    priceCacheRef.lastUpdate = null;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
  });

  test('GET / returns metadata', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toMatch(/Oracle/i);
    expect(res.body.endpoints).toHaveProperty('/api/price/res');
  });
});
