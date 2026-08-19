import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.ts';

const shipment = {
  sender: 'Finca La Esperanza',
  recipient: 'Nordic Roastery',
  batchId: 'BATCH-001',
  weightKg: 60,
};

describe('Coffee ledger API', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  describe('GET /blockchain', () => {
    it('returns 200 with the chain', async () => {
      const response = await request(app).get('/blockchain');

      expect(response.status).toBe(200);
      expect(response.body.chain).toHaveLength(1);
      expect(response.body.chain[0].index).toBe(0);
    });

    it('reports the pending pool, the length and the validity of the chain', async () => {
      const response = await request(app).get('/blockchain');

      expect(response.body.length).toBe(1);
      expect(response.body.pendingTransactions).toEqual([]);
      expect(response.body.isValid).toBe(true);
    });
  });

  describe('POST /transactions', () => {
    it('accepts a valid shipment with 201 and reports its future block', async () => {
      const response = await request(app).post('/transactions').send(shipment);

      expect(response.status).toBe(201);
      expect(response.body.blockIndex).toBe(1);
      expect(response.body.transaction).toEqual(shipment);
    });

    it('places the shipment in the pending pool', async () => {
      await request(app).post('/transactions').send(shipment);
      const response = await request(app).get('/blockchain');

      expect(response.body.pendingTransactions).toEqual([shipment]);
    });

    it.each(['sender', 'recipient', 'batchId', 'weightKg'])(
      'rejects a shipment missing %s with 400',
      async (field) => {
        const body: Record<string, unknown> = { ...shipment };
        delete body[field];

        const response = await request(app).post('/transactions').send(body);

        expect(response.status).toBe(400);
        expect(response.body.details.join(' ')).toMatch(new RegExp(field));
      },
    );

    it.each([0, -5, 'heavy', null])('rejects an invalid weightKg of %s', async (weightKg) => {
      const response = await request(app)
        .post('/transactions')
        .send({ ...shipment, weightKg });

      expect(response.status).toBe(400);
      expect(response.body.details.join(' ')).toMatch(/weightKg/);
    });

    it('rejects a blank sender, not just a missing one', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({ ...shipment, sender: '   ' });

      expect(response.status).toBe(400);
    });

    it('rejects a request with no body at all', async () => {
      const response = await request(app).post('/transactions');

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveLength(4);
    });

    it('does not queue a rejected shipment', async () => {
      await request(app).post('/transactions').send({ sender: 'nobody' });
      const response = await request(app).get('/blockchain');

      expect(response.body.pendingTransactions).toEqual([]);
    });
  });

  describe('POST /mine', () => {
    beforeEach(async () => {
      await request(app).post('/transactions').send(shipment);
    });

    it('mines the pending pool into a new block with 201', async () => {
      const response = await request(app).post('/mine');

      expect(response.status).toBe(201);
      expect(response.body.block.index).toBe(1);
      expect(response.body.block.transactions).toEqual([shipment]);
    });

    it('appends the block to the chain and empties the pool', async () => {
      await request(app).post('/mine');
      const response = await request(app).get('/blockchain');

      expect(response.body.chain).toHaveLength(2);
      expect(response.body.pendingTransactions).toEqual([]);
    });

    it('leaves the chain valid', async () => {
      await request(app).post('/mine');
      const response = await request(app).get('/blockchain');

      expect(response.body.isValid).toBe(true);
    });

    it('returns a block whose hash meets the difficulty target', async () => {
      const response = await request(app).post('/mine');

      expect(response.body.block.hash.startsWith('0')).toBe(true);
    });

    it('returns 400 when there is nothing to mine', async () => {
      await request(app).post('/mine');
      const response = await request(app).post('/mine');

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/no pending transactions/i);
    });
  });

  describe('unknown routes', () => {
    it('returns a JSON 404 rather than Express default HTML', async () => {
      const response = await request(app).get('/does-not-exist');

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/not found/i);
    });
  });
});
