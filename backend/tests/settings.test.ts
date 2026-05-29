/**
 * Integration tests for POST /api/settings/test-notification.
 * Verifies the endpoint returns correct per-channel status strings
 * ('ok', 'skipped', or an error message) for every combination of
 * configured / unconfigured / failing channels.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mocks ────────────────────────────────────────────────────────────────────
// vi.mock factories are hoisted to top of file, so mock variables must be
// hoisted via vi.hoisted() to be available inside those factories.
const { mockSgSetApiKey, mockSgSend, mockSendMail, mockAxiosPost } = vi.hoisted(() => ({
  mockSgSetApiKey: vi.fn(),
  mockSgSend: vi.fn(),
  mockSendMail: vi.fn(),
  mockAxiosPost: vi.fn(),
}));

vi.mock('@sendgrid/mail', () => ({
  default: { setApiKey: mockSgSetApiKey, send: mockSgSend },
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: mockSendMail })) },
}));

vi.mock('twilio', () => ({
  default: vi.fn(() => ({ messages: { create: vi.fn().mockResolvedValue({}) } })),
}));

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: mockAxiosPost },
}));

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

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/settings/test-notification', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Response shape ──────────────────────────────────────────────────────────
  it('always returns all four channel keys', async () => {
    const res = await request(app).post('/api/settings/test-notification').send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sendgrid');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('whatsapp');
    expect(res.body).toHaveProperty('teams');
  });

  // ── All skipped when nothing configured ────────────────────────────────────
  it('returns skipped for every channel when body is empty', async () => {
    const res = await request(app).post('/api/settings/test-notification').send({});
    expect(res.body.sendgrid).toBe('skipped');
    expect(res.body.email).toBe('skipped');
    expect(res.body.whatsapp).toBe('skipped');
    expect(res.body.teams).toBe('skipped');
  });

  // ── SendGrid: skipped when fields are partial ──────────────────────────────
  it('returns sendgrid: skipped when only apiKey is provided (from/to missing)', async () => {
    const res = await request(app)
      .post('/api/settings/test-notification')
      .send({ sendgridApiKey: 'SG.test' });
    expect(res.body.sendgrid).toBe('skipped');
    expect(mockSgSend).not.toHaveBeenCalled();
  });

  it('returns sendgrid: skipped when apiKey + to are set but from is missing', async () => {
    const res = await request(app)
      .post('/api/settings/test-notification')
      .send({ sendgridApiKey: 'SG.test', sendgridTo: 'to@x.com' });
    expect(res.body.sendgrid).toBe('skipped');
    expect(mockSgSend).not.toHaveBeenCalled();
  });

  it('returns sendgrid: skipped when apiKey + from are set but to is missing', async () => {
    const res = await request(app)
      .post('/api/settings/test-notification')
      .send({ sendgridApiKey: 'SG.test', sendgridFrom: 'from@x.com' });
    expect(res.body.sendgrid).toBe('skipped');
    expect(mockSgSend).not.toHaveBeenCalled();
  });

  // ── SendGrid: ok when all three fields present ─────────────────────────────
  it('returns sendgrid: ok and calls sgMail.send when fully configured', async () => {
    mockSgSend.mockResolvedValue([{ statusCode: 202 }]);

    const res = await request(app)
      .post('/api/settings/test-notification')
      .send({
        sendgridApiKey: 'SG.test-key',
        sendgridFrom: 'alerts@example.com',
        sendgridTo: 'sailor@example.com',
      });

    expect(res.status).toBe(200);
    expect(res.body.sendgrid).toBe('ok');
    expect(mockSgSetApiKey).toHaveBeenCalledWith('SG.test-key');
    expect(mockSgSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'sailor@example.com',
        from: 'alerts@example.com',
      }),
    );
  });

  // ── SendGrid: error message surfaced when API rejects ─────────────────────
  it('returns the SendGrid error message when the API key is invalid', async () => {
    mockSgSend.mockRejectedValue(
      new Error('The provided authorization grant is invalid, expired, or revoked'),
    );

    const res = await request(app)
      .post('/api/settings/test-notification')
      .send({
        sendgridApiKey: 'SG.bad-key',
        sendgridFrom: 'alerts@example.com',
        sendgridTo: 'sailor@example.com',
      });

    expect(res.body.sendgrid).toMatch(/invalid|expired|revoked/i);
  });

  it('returns error when the from address is not a verified SendGrid sender', async () => {
    mockSgSend.mockRejectedValue(
      new Error('The from address does not match a verified Sender Identity'),
    );

    const res = await request(app)
      .post('/api/settings/test-notification')
      .send({
        sendgridApiKey: 'SG.valid-key',
        sendgridFrom: 'unverified@example.com',
        sendgridTo: 'sailor@example.com',
      });

    expect(res.body.sendgrid).toMatch(/verified/i);
  });

  // ── Other channels not affected by SendGrid result ─────────────────────────
  it('other channels return skipped even when sendgrid fails', async () => {
    mockSgSend.mockRejectedValue(new Error('API error'));

    const res = await request(app)
      .post('/api/settings/test-notification')
      .send({
        sendgridApiKey: 'SG.key',
        sendgridFrom: 'f@x.com',
        sendgridTo: 't@x.com',
      });

    expect(res.body.email).toBe('skipped');
    expect(res.body.whatsapp).toBe('skipped');
    expect(res.body.teams).toBe('skipped');
  });

  // ── SMTP email ─────────────────────────────────────────────────────────────
  it('returns email: ok when SMTP is fully configured', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'abc' });

    const res = await request(app)
      .post('/api/settings/test-notification')
      .send({
        emailHost: 'smtp.example.com',
        emailUser: 'user@example.com',
        emailTo: 'sailor@example.com',
        emailPass: 'secret',
        emailFrom: 'user@example.com',
      });

    expect(res.body.email).toBe('ok');
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('returns email: skipped when emailHost is missing', async () => {
    const res = await request(app)
      .post('/api/settings/test-notification')
      .send({ emailUser: 'u@x.com', emailTo: 't@x.com' });
    expect(res.body.email).toBe('skipped');
  });

  // ── MS Teams ───────────────────────────────────────────────────────────────
  it('returns teams: ok when webhook is configured', async () => {
    mockAxiosPost.mockResolvedValue({ status: 200 });

    const res = await request(app)
      .post('/api/settings/test-notification')
      .send({ teamsWebhook: 'https://outlook.office.com/webhook/test' });

    expect(res.body.teams).toBe('ok');
    expect(mockAxiosPost).toHaveBeenCalledWith(
      'https://outlook.office.com/webhook/test',
      expect.anything(),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/settings/simulate-email', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns only sendgrid and email keys (no whatsapp or teams)', async () => {
    const res = await request(app).post('/api/settings/simulate-email').send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sendgrid');
    expect(res.body).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('whatsapp');
    expect(res.body).not.toHaveProperty('teams');
  });

  it('returns skipped for both channels when nothing is configured', async () => {
    const res = await request(app).post('/api/settings/simulate-email').send({});
    expect(res.body.sendgrid).toBe('skipped');
    expect(res.body.email).toBe('skipped');
  });

  it('returns sendgrid: ok and sends HTML email when fully configured', async () => {
    mockSgSend.mockResolvedValue([{ statusCode: 202 }]);

    const res = await request(app).post('/api/settings/simulate-email').send({
      sendgridApiKey: 'SG.test-key',
      sendgridFrom: 'alerts@example.com',
      sendgridTo: 'sailor@example.com',
    });

    expect(res.body.sendgrid).toBe('ok');
    expect(mockSgSend).toHaveBeenCalledWith(
      expect.objectContaining({ html: expect.stringContaining('<!DOCTYPE html>') }),
    );
  });

  it('returns email: ok and sends HTML when SMTP is configured', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'abc' });

    const res = await request(app).post('/api/settings/simulate-email').send({
      emailHost: 'smtp.example.com',
      emailUser: 'user@example.com',
      emailTo: 'sailor@example.com',
      emailPass: 'secret',
      emailFrom: 'user@example.com',
    });

    expect(res.body.email).toBe('ok');
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ html: expect.stringContaining('<!DOCTYPE html>') }),
    );
  });

  it('sends the preview spot name in the HTML', async () => {
    mockSgSend.mockResolvedValue([{ statusCode: 202 }]);

    await request(app).post('/api/settings/simulate-email').send({
      sendgridApiKey: 'SG.key', sendgridFrom: 'f@x.com', sendgridTo: 't@x.com',
    });

    const sentHtml: string = mockSgSend.mock.calls[0][0].html;
    expect(sentHtml).toContain('Kiel Fjord');
  });

  it('returns error message when SendGrid rejects', async () => {
    mockSgSend.mockRejectedValue(new Error('API key invalid'));

    const res = await request(app).post('/api/settings/simulate-email').send({
      sendgridApiKey: 'SG.bad',
      sendgridFrom: 'f@x.com',
      sendgridTo: 't@x.com',
    });

    expect(res.body.sendgrid).toMatch(/invalid/i);
    expect(res.body.email).toBe('skipped');
  });
});
