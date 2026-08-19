import { describe, it, expect } from 'vitest';
import { calculateHash } from '../src/hash.ts';
import type { Transaction } from '../src/types.ts';

const transactions: Transaction[] = [
  { sender: 'Finca La Esperanza', recipient: 'Nordic Roastery', batchId: 'BATCH-001', weightKg: 60 },
];

const block = {
  index: 1,
  previousHash: '0'.repeat(64),
  timestamp: 1_700_000_000_000,
  transactions,
  nonce: 0,
};

describe('calculateHash', () => {
  it('returns a 64-character hexadecimal SHA-256 digest', () => {
    expect(calculateHash(block)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for identical input', () => {
    expect(calculateHash(block)).toBe(calculateHash({ ...block }));
  });

  it('changes when the nonce changes', () => {
    expect(calculateHash({ ...block, nonce: 1 })).not.toBe(calculateHash(block));
  });

  it('changes when the index changes', () => {
    expect(calculateHash({ ...block, index: 2 })).not.toBe(calculateHash(block));
  });

  it('changes when the previous hash changes', () => {
    expect(calculateHash({ ...block, previousHash: 'f'.repeat(64) })).not.toBe(calculateHash(block));
  });

  it('changes when a transaction is tampered with', () => {
    const tampered = [{ ...transactions[0]!, weightKg: 6000 }];
    expect(calculateHash({ ...block, transactions: tampered })).not.toBe(calculateHash(block));
  });

  it('ignores an existing hash field, so a stored block can be re-verified', () => {
    const alreadyHashed = { ...block, hash: 'deadbeef'.repeat(8) };
    expect(calculateHash(alreadyHashed)).toBe(calculateHash(block));
  });
});
