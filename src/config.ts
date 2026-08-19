/** Immediate hashing — keeps the mining loop from stalling the test suite. */
export const TEST_DIFFICULTY = 1;

/** Real work: each extra zero makes a valid hash ~16x rarer to find. */
export const PRODUCTION_DIFFICULTY = 3;

/**
 * Resolves the Proof-of-Work difficulty from the environment.
 *
 * Both inputs default to the real environment, but are parameters so the
 * behaviour can be unit tested without mutating `process.env` globally.
 */
export function getDifficulty(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  override: string | undefined = process.env.POW_DIFFICULTY,
): number {
  const explicit = Number(override);

  if (Number.isInteger(explicit) && explicit > 0) {
    return explicit;
  }

  return nodeEnv === 'test' ? TEST_DIFFICULTY : PRODUCTION_DIFFICULTY;
}
