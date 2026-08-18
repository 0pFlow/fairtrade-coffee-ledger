import { createHash } from 'node:crypto';
import type { UnhashedBlock } from './types.ts';

/**
 * SHA-256 over the block's contents. Every field is included, so changing any
 * one of them — including a single transaction's weight — produces a
 * completely different digest. That is what makes the chain tamper-evident.
 */
export function calculateHash(block: UnhashedBlock): string {
  const { index, previousHash, timestamp, transactions, nonce } = block;
  const payload = `${index}${previousHash}${timestamp}${JSON.stringify(transactions)}${nonce}`;

  return createHash('sha256').update(payload).digest('hex');
}
