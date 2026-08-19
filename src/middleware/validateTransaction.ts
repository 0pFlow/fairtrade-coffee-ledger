import type { Request, Response, NextFunction } from 'express';

const REQUIRED_TEXT_FIELDS = ['sender', 'recipient', 'batchId'] as const;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * Collects every problem with a submitted shipment rather than failing on the
 * first one, so the client can fix the whole request in one round trip.
 */
export function collectTransactionErrors(body: unknown): string[] {
  const candidate = (body ?? {}) as Record<string, unknown>;

  const textErrors = REQUIRED_TEXT_FIELDS.filter(
    (field) => !isNonEmptyString(candidate[field]),
  ).map((field) => `${field} is required and must be a non-empty string`);

  const weightErrors = isPositiveNumber(candidate.weightKg)
    ? []
    : ['weightKg is required and must be a number greater than 0'];

  return [...textErrors, ...weightErrors];
}

/**
 * Guards the write endpoints. Nothing untrusted reaches the ledger: an
 * uncertified batch with no batchId is rejected at the boundary, before it can
 * ever be queued or mined into a block.
 */
export function validateTransaction(req: Request, res: Response, next: NextFunction): void {
  const details = collectTransactionErrors(req.body);

  if (details.length > 0) {
    res.status(400).json({ error: 'Validation failed', details });
    return;
  }

  next();
}
