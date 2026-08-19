import { calculateHash } from './hash.ts';
import { getDifficulty } from './config.ts';
import type { Block, Transaction, UnhashedBlock } from './types.ts';

/** Nothing precedes the genesis block, so its previousHash is a placeholder. */
const GENESIS_PREVIOUS_HASH = '0';

export class Blockchain {
  chain: Block[];
  pendingTransactions: Transaction[];
  difficulty: number;

  constructor(difficulty: number = getDifficulty()) {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = difficulty;
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

  /**
   * Proof-of-Work. Every field of the block is fixed except the nonce, so the
   * only way to find a hash with the required leading zeros is to keep
   * incrementing the nonce and re-hashing. That cost is what makes rewriting
   * history expensive: tampering with an old block invalidates its hash, and
   * re-mining it means redoing this search for that block and every one after.
   */
  minePendingTransactions(): Block {
    if (this.pendingTransactions.length === 0) {
      throw new Error('Cannot mine: no pending transactions');
    }

    const previousBlock = this.getLatestBlock();
    const candidate: UnhashedBlock = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      previousHash: previousBlock.hash,
      nonce: 0,
    };

    const target = '0'.repeat(this.difficulty);
    let nonce = 0;
    let hash = calculateHash(candidate);

    while (!hash.startsWith(target)) {
      nonce += 1;
      hash = calculateHash({ ...candidate, nonce });
    }

    const block: Block = { ...candidate, nonce, hash };

    this.chain = [...this.chain, block];
    this.pendingTransactions = [];

    return block;
  }

  /**
   * Walks the chain from block 1 (genesis has no predecessor to check) and
   * verifies two things per block:
   *
   * 1. its stored hash still matches a fresh recomputation of its contents
   * 2. its previousHash still matches the real hash of the block before it
   *
   * Check 1 catches an edited block. Check 2 catches the smarter attacker who
   * edits a block and re-hashes it, because doing so breaks the link held by
   * every block that follows — which is why rewriting history means re-mining
   * the entire remainder of the chain.
   */
  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i += 1) {
      const currentBlock = this.chain[i]!;
      const previousBlock = this.chain[i - 1]!;

      if (currentBlock.hash !== calculateHash(currentBlock)) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }
}
