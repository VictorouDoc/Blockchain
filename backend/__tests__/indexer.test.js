/**
 * __tests__/indexer.test.js
 *
 * Tests for indexer.js
 */

import request from 'supertest';
import { jest } from '@jest/globals';

jest.useRealTimers();

// Mocks
jest.mock('fs');
jest.mock('ethers');

import fs from 'fs';
import { ethers } from 'ethers';

import {
  app,
  loadDeployment,
  setupContracts,
  indexKYCEvents,
  indexTransferEvents,
  syncBlockchain,
  database
} from '../indexer.js';

describe('Indexer Service - unit tests', () => {
  const fakeDeployment = {
    contracts: {
      KYCRegistry: '0xKYC',
      RealEstateToken: '0xTOKEN'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset in-memory database
    database.kycEvents = [];
    database.transfers = [];
    database.lastSyncedBlock = 0;
  });

  /***************
   * fs mocks for loadDeployment()
   ***************/
  test('loadDeployment loads sepolia-latest.json when present', () => {
    // fs.existsSync for latest path
    fs.existsSync.mockImplementation(path => path.endsWith('sepolia-latest.json') ? true : false);
    fs.readFileSync.mockImplementation(path => JSON.stringify(fakeDeployment));

    const dep = loadDeployment();
    expect(dep.contracts).toBeDefined();
    expect(dep.contracts.KYCRegistry).toBe(fakeDeployment.contracts.KYCRegistry);
  });

  test('loadDeployment falls back to other sepolia files', () => {
    // no latest file
    fs.existsSync.mockReturnValue(false);
    // readdirSync returns list
    fs.readdirSync.mockReturnValue(['sepolia-1.json', 'sepolia-2.json']);
    // readFileSync returns JSON for first file
    fs.readFileSync.mockImplementation((path) => {
      if (path.includes('sepolia-2.json')) return JSON.stringify(fakeDeployment);
      throw new Error('unexpected read');
    });

    const dep = loadDeployment();
    expect(dep.contracts.KYCRegistry).toBe(fakeDeployment.contracts.KYCRegistry);
  });

  test('loadDeployment throws if no sepolia files', () => {
    fs.existsSync.mockReturnValue(false);
    fs.readdirSync.mockReturnValue([]);
    expect(() => loadDeployment()).toThrow('No Sepolia deployment found');
  });

  /***************
   * ethers / contracts mocks
   ***************/
  test('setupContracts returns provider and contract instances', async () => {
    // Mock fs.readFileSync for ABIs
    fs.readFileSync.mockImplementation((p) => {
      // Return minimal JSON with abi
      return JSON.stringify({ abi: [] });
    });

    // Mock loadDeployment path reading: ensure read file for deployment
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(fakeDeployment)).mockImplementation(() => JSON.stringify({ abi: [] }));

    // Mock ethers.JsonRpcProvider
    const fakeProvider = { getBlockNumber: jest.fn().mockResolvedValue(1000) };
    ethers.JsonRpcProvider.mockImplementation(() => fakeProvider);

    // Mock ethers.Contract to return simple objects
    ethers.Contract.mockImplementation((address) => {
      if (address === fakeDeployment.contracts.KYCRegistry) {
        return {
          filters: {
            Whitelisted: () => ({ topic: 'W' }),
            Blacklisted: () => ({ topic: 'B' })
          },
          queryFilter: jest.fn().mockResolvedValue([])
        };
      } else {
        return {
          filters: {
            Transfer: () => ({ topic: 'T' })
          },
          queryFilter: jest.fn().mockResolvedValue([])
        };
      }
    });

    const { provider, kycRegistry, realEstateToken } = await setupContracts();
    expect(provider).toBe(fakeProvider);
    expect(kycRegistry.filters).toHaveProperty('Whitelisted');
    expect(realEstateToken.filters).toHaveProperty('Transfer');
  });

  test('indexKYCEvents stores whitelisted and blacklisted events', async () => {
    // create a mock kycRegistry that returns two events
    const whitelistedEvent = {
      args: { account: '0xAAA' },
      blockNumber: 10,
      transactionHash: '0xhash1'
    };
    const blacklistedEvent = {
      args: { account: '0xBBB' },
      blockNumber: 11,
      transactionHash: '0xhash2'
    };

    const kycRegistry = {
      filters: {
        Whitelisted: () => ({}),
        Blacklisted: () => ({})
      },
      queryFilter: jest.fn()
        // first call -> whitelisted
        .mockResolvedValueOnce([whitelistedEvent])
        // second call -> blacklisted
        .mockResolvedValueOnce([blacklistedEvent])
    };

    const count = await indexKYCEvents(kycRegistry, 1, 20);
    expect(count).toBe(2);
    expect(database.kycEvents.length).toBeGreaterThanOrEqual(2);
    const types = database.kycEvents.map(e => e.type).sort();
    expect(types).toEqual(['Blacklisted', 'Whitelisted']);
  });

  test('indexKYCEvents handles no events gracefully', async () => {
    const kycRegistry = {
      filters: { Whitelisted: () => ({}), Blacklisted: () => ({}) },
      queryFilter: jest.fn().mockResolvedValue([])
    };

    const count = await indexKYCEvents(kycRegistry, 1, 20);
    expect(count).toBe(0);
  });

  test('indexTransferEvents stores transfer events and formats value', async () => {
    // event with BigInt-like value; indexer uses ethers.formatEther
    const transferEvent = {
      args: { from: '0xF', to: '0xT', value: '1000000000000000000' }, // 1e18
      blockNumber: 20,
      transactionHash: '0xtransfer'
    };

    // Mock ethers.formatEther to behave like real formatting
    ethers.formatEther = jest.fn((val) => {
      // val is '1000000000000000000' -> 1.0
      if (val === '1000000000000000000') return '1.0';
      return '0';
    });

    const token = {
      filters: { Transfer: () => ({}) },
      queryFilter: jest.fn().mockResolvedValue([transferEvent])
    };

    const count = await indexTransferEvents(token, 1, 50);
    expect(count).toBe(1);
    expect(database.transfers.length).toBeGreaterThanOrEqual(1);
    expect(database.transfers[0].value).toBe('1.0');
    expect(database.transfers[0].from).toBe('0xF');
    expect(database.transfers[0].to).toBe('0xT');
  });

  test('syncBlockchain coordinates indexing and updates lastSyncedBlock', async () => {
    // Setup mocked provider and contract behavior to return current block and no events
    const fakeProvider = { getBlockNumber: jest.fn().mockResolvedValue(5000) };

    // Mock setupContracts to return our provider and simple contract mocks.
    const fakeKYC = { filters: { Whitelisted: () => ({}), Blacklisted: () => ({}) }, queryFilter: jest.fn().mockResolvedValue([]) };
    const fakeToken = { filters: { Transfer: () => ({}) }, queryFilter: jest.fn().mockResolvedValue([]) };

    // Spy on setupContracts and make it return our fakes
    const setupContractsSpy = jest.spyOn({ setupContracts }, 'setupContracts')
      .mockImplementation(async () => ({ provider: fakeProvider, kycRegistry: fakeKYC, realEstateToken: fakeToken }));

    // run syncBlockchain
    await syncBlockchain();

    expect(database.lastSyncedBlock).toBe(5000);

    // restore spy
    setupContractsSpy.mockRestore();
  });

  // Express endpoints
  test('GET /api/events/kyc returns expected structure', async () => {
    // prepopulate database
    database.kycEvents = [{ type: 'Whitelisted', address: '0x1' }, { type: 'Blacklisted', address: '0x2' }];

    const res = await request(app).get('/api/events/kyc');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(database.kycEvents.length);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/events/transfers returns expected structure', async () => {
    database.transfers = [{ from: '0x1', to: '0x2', value: '1.0' }];

    const res = await request(app).get('/api/events/transfers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(database.transfers.length);
  });

  test('GET /api/stats returns computed stats', async () => {
    database.kycEvents = [{ type: 'Whitelisted' }, { type: 'Blacklisted' }, { type: 'Whitelisted' }];
    database.transfers = [{}, {}];
    database.lastSyncedBlock = 12345;

    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.lastSyncedBlock).toBe(12345);
    expect(res.body.data.totalKYCEvents).toBe(3);
    expect(res.body.data.whitelisted).toBe(2);
    expect(res.body.data.blacklisted).toBe(1);
  });

  test('GET /api/health returns structure with uptime and lastSync', async () => {
    database.lastSyncedBlock = 999;
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uptime');
    expect(res.body.lastSync).toBe(999);
  });

  test('GET / root returns metadata', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toMatch(/Indexer/i);
    expect(res.body.endpoints).toHaveProperty('/api/events/kyc');
  });
});
