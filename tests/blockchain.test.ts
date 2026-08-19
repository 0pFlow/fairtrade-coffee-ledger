import { describe, it, expect, beforeEach } from 'vitest';
import { Blockchain } from '../src/blockchain.ts';
import { calculateHash } from '../src/hash.ts';
import { getDifficulty } from '../src/config.ts';
import type { Transaction } from '../src/types.ts';

const shipment: Transaction = {
  sender: 'Finca La Esperanza',
  recipient: 'Nordic Roastery',
  batchId: 'BATCH-001',
  weightKg: 60,
};

describe('Blockchain', () => {
  let blockchain: Blockchain;

  beforeEach(() => {
    blockchain = new Blockchain();
  });

  describe('genesis block', () => {
    it('creates a chain containing exactly one block', () => {
      expect(blockchain.chain).toHaveLength(1);
    });

    it('gives the genesis block index 0', () => {
      expect(blockchain.chain[0]?.index).toBe(0);
    });

    it('gives the genesis block a placeholder previousHash, since nothing precedes it', () => {
      expect(blockchain.chain[0]?.previousHash).toBe('0');
    });

    it('creates the genesis block with no transactions', () => {
      expect(blockchain.chain[0]?.transactions).toEqual([]);
    });

    it('stores a hash on the genesis block that matches its own contents', () => {
      const genesis = blockchain.chain[0]!;
      expect(genesis.hash).toBe(calculateHash(genesis));
    });

    it('starts with an empty pending transaction pool', () => {
      expect(blockchain.pendingTransactions).toEqual([]);
    });
  });

  describe('getLatestBlock', () => {
    it('returns the last block in the chain', () => {
      expect(blockchain.getLatestBlock()).toBe(blockchain.chain.at(-1));
    });
  });

  describe('addTransaction', () => {
    it('queues the transaction in the pending pool', () => {
      blockchain.addTransaction(shipment);
      expect(blockchain.pendingTransactions).toEqual([shipment]);
    });

    it('does not touch the chain until the block is mined', () => {
      blockchain.addTransaction(shipment);
      expect(blockchain.chain).toHaveLength(1);
    });

    it('preserves insertion order for multiple shipments', () => {
      const second: Transaction = {
        sender: 'Nordic Roastery',
        recipient: 'Kafé Stockholm',
        batchId: 'BATCH-002',
        weightKg: 12,
      };

      blockchain.addTransaction(shipment);
      blockchain.addTransaction(second);

      expect(blockchain.pendingTransactions).toEqual([shipment, second]);
    });

    it('returns the index of the block the transaction will be mined into', () => {
      expect(blockchain.addTransaction(shipment)).toBe(1);
    });
  });

  describe('difficulty', () => {
    it('takes its difficulty from the environment configuration', () => {
      expect(blockchain.difficulty).toBe(getDifficulty());
    });

    it('accepts an explicit difficulty, so tests can exercise a harder target', () => {
      expect(new Blockchain(2).difficulty).toBe(2);
    });
  });

  describe('minePendingTransactions', () => {
    beforeEach(() => {
      blockchain.addTransaction(shipment);
    });

    it('appends exactly one block to the chain', () => {
      blockchain.minePendingTransactions();
      expect(blockchain.chain).toHaveLength(2);
    });

    it('returns the block it just mined', () => {
      expect(blockchain.minePendingTransactions()).toBe(blockchain.getLatestBlock());
    });

    it('moves the pending transactions into the block', () => {
      expect(blockchain.minePendingTransactions().transactions).toEqual([shipment]);
    });

    it('empties the pending pool once mined', () => {
      blockchain.minePendingTransactions();
      expect(blockchain.pendingTransactions).toEqual([]);
    });

    it('numbers the block one after its predecessor', () => {
      expect(blockchain.minePendingTransactions().index).toBe(1);
    });

    it('links the block to the hash of its predecessor', () => {
      const previousHash = blockchain.getLatestBlock().hash;
      expect(blockchain.minePendingTransactions().previousHash).toBe(previousHash);
    });

    it('finds a hash with the required number of leading zeros', () => {
      const block = blockchain.minePendingTransactions();
      expect(block.hash.startsWith('0'.repeat(blockchain.difficulty))).toBe(true);
    });

    it('keeps searching until a harder target is satisfied', () => {
      const harder = new Blockchain(2);
      harder.addTransaction(shipment);
      expect(harder.minePendingTransactions().hash.startsWith('00')).toBe(true);
    });

    it('records the nonce it stopped at', () => {
      const { nonce } = blockchain.minePendingTransactions();
      expect(Number.isInteger(nonce)).toBe(true);
      expect(nonce).toBeGreaterThanOrEqual(0);
    });

    it('stores a hash that still matches when recomputed from the block', () => {
      const block = blockchain.minePendingTransactions();
      expect(block.hash).toBe(calculateHash(block));
    });

    it('refuses to mine an empty pool, so no empty blocks enter the ledger', () => {
      blockchain.minePendingTransactions();
      expect(() => blockchain.minePendingTransactions()).toThrow(/no pending transactions/i);
    });
  });
});
