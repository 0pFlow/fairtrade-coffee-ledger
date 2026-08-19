import { calculateHash } from './hash.ts';
import type { Block, Transaction, UnhashedBlock } from './types.ts';

/** Nothing precedes the genesis block, so its previousHash is a placeholder. */
const GENESIS_PREVIOUS_HASH = '0';

export class Blockchain {
  chain: Block[];
  pendingTransactions: Transaction[];

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
  }

  /**
   * The first block is generated, never hardcoded — the chain bootstraps
   * itself so that every block in it was produced by the same code path.
   */
  createGenesisBlock(): Block {
    const block: UnhashedBlock = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: GENESIS_PREVIOUS_HASH,
      nonce: 0,
    };

    return { ...block, hash: calculateHash(block) };
  }

  getLatestBlock(): Block {
    return this.chain.at(-1)!;
  }

  /**
   * Queues a coffee shipment. It is not part of the ledger until it has been
   * mined into a block, so we return the index of the block it will land in.
   */
  addTransaction(transaction: Transaction): number {
    this.pendingTransactions = [...this.pendingTransactions, transaction];

    return this.getLatestBlock().index + 1;
  }
}
