import express, { type Express } from 'express';
import { Blockchain } from './blockchain.ts';
import { validateTransaction } from './middleware/validateTransaction.ts';
import type { Transaction } from './types.ts';

/**
 * Builds the Express application. The ledger is a parameter so tests can hand
 * in a fresh chain, and this module never calls listen() — binding a port is
 * server.ts's job, which keeps the app importable from a test process.
 */
export function createApp(blockchain: Blockchain = new Blockchain()): Express {
  const app = express();

  app.use(express.json());

  app.get('/blockchain', (_req, res) => {
    res.json({
      length: blockchain.chain.length,
      chain: blockchain.chain,
      pendingTransactions: blockchain.pendingTransactions,
      isValid: blockchain.isChainValid(),
    });
  });

  app.post('/transactions', validateTransaction, (req, res) => {
    // Shape already guaranteed by validateTransaction.
    const { sender, recipient, batchId, weightKg } = req.body as Transaction;
    const transaction: Transaction = { sender, recipient, batchId, weightKg };
    const blockIndex = blockchain.addTransaction(transaction);

    res.status(201).json({
      message: `Shipment queued for block ${blockIndex}`,
      blockIndex,
      transaction,
    });
  });

  app.post('/mine', (_req, res) => {
    if (blockchain.pendingTransactions.length === 0) {
      res.status(400).json({ error: 'Cannot mine: no pending transactions' });
      return;
    }

    const block = blockchain.minePendingTransactions();

    res.status(201).json({ message: `Block ${block.index} mined`, block });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
