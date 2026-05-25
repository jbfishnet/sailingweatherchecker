import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/db/index.js', () => {
  const stmt = { all: () => [], run: () => ({ lastInsertRowid: 1 }), get: () => undefined };
  return {
    default: {
      prepare: () => stmt,
      exec: () => {},
      transaction: (fn: any) => (args: any) => fn(args),
    },
  };
});

import app from '../src/app.js';

describe('API Endpoints', () => {
  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/spots should return an array', async () => {
    const res = await request(app).get('/api/spots');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/settings should return settings object', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('minBeaufort');
  });
});
