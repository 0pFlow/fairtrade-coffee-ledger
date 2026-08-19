import { describe, it, expect } from 'vitest';
import { getDifficulty } from '../src/config.ts';

describe('getDifficulty', () => {
  it('returns 1 under NODE_ENV=test so the mining loop never stalls the suite', () => {
    expect(getDifficulty('test')).toBe(1);
  });

  it('returns a production difficulty of at least 2', () => {
    expect(getDifficulty('production')).toBeGreaterThanOrEqual(2);
  });

  it('falls back to the production difficulty when NODE_ENV is unset', () => {
    expect(getDifficulty(undefined)).toBeGreaterThanOrEqual(2);
  });

  it('reads the running process environment by default', () => {
    expect(getDifficulty()).toBe(1);
  });

  it('lets POW_DIFFICULTY override the environment default', () => {
    expect(getDifficulty('production', '4')).toBe(4);
  });

  it('ignores a POW_DIFFICULTY that is not a positive integer', () => {
    expect(getDifficulty('test', 'not-a-number')).toBe(1);
    expect(getDifficulty('test', '0')).toBe(1);
  });
});
