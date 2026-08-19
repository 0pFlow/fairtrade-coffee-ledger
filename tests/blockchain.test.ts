import { describe, it, expect, beforeEach } from 'vitest';
import { Blockchain } from '../src/blockchain.ts';
import { calculateHash } from '../src/hash.ts';
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
});
