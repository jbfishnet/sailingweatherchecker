/**
 * Notification service unit tests.
 * All external SDKs are mocked — no real network calls are made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock factories are hoisted to the top of the file by Vitest, so any
// variables they reference must also be hoisted via vi.hoisted().
const { mockSgSetApiKey, mockSgSend, mockSendMail, mockTwilioCreate, mockAxiosPost } = vi.hoisted(() => ({
  mockSgSetApiKey: vi.fn(),
  mockSgSend: vi.fn(),
  mockSendMail: vi.fn(),
  mockTwilioCreate: vi.fn(),
  mockAxiosPost: vi.fn(),
}));

vi.mock('@sendgrid/mail', () => ({
  default: { setApiKey: mockSgSetApiKey, send: mockSgSend },
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: mockSendMail })) },
}));

vi.mock('twilio', () => ({
  default: vi.fn(() => ({ messages: { create: mockTwilioCreate } })),
}));

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: mockAxiosPost },
}));

import {
  sendSendGrid,
  sendEmail,
  sendWhatsApp,
  sendTeams,
  notifyAll,
} from '../src/services/notifications.js';

// ─────────────────────────────────────────────────────────────────────────────

describe('sendSendGrid', () => {
  beforeEach(() => vi.clearAllMocks());

  const full = {
    sendgridApiKey: 'SG.test-key',
    sendgridFrom: 'alerts@example.com',
    sendgridTo: 'sailor@example.com',
  };

  it('calls setApiKey and send with correct arguments', async () => {
    mockSgSend.mockResolvedValue([{ statusCode: 202 }]);

    await sendSendGrid(full, 'Good wind!', 'Wind is 3 Bft at Kiel.');

    expect(mockSgSetApiKey).toHaveBeenCalledWith('SG.test-key');
    expect(mockSgSend).toHaveBeenCalledWith({
      to: 'sailor@example.com',
      from: 'alerts@example.com',
      subject: 'Good wind!',
      text: 'Wind is 3 Bft at Kiel.',
    });
  });

  it('skips when sendgridApiKey is missing', async () => {
    await sendSendGrid({ sendgridFrom: full.sendgridFrom, sendgridTo: full.sendgridTo }, 'S', 'B');
    expect(mockSgSend).not.toHaveBeenCalled();
  });

  it('skips when sendgridFrom is missing', async () => {
    await sendSendGrid({ sendgridApiKey: full.sendgridApiKey, sendgridTo: full.sendgridTo }, 'S', 'B');
    expect(mockSgSend).not.toHaveBeenCalled();
  });

  it('skips when sendgridTo is missing', async () => {
    await sendSendGrid({ sendgridApiKey: full.sendgridApiKey, sendgridFrom: full.sendgridFrom }, 'S', 'B');
    expect(mockSgSend).not.toHaveBeenCalled();
  });

  it('throws when SendGrid returns invalid API key error', async () => {
    mockSgSend.mockRejectedValue(
      new Error('The provided authorization grant is invalid, expired, or revoked'),
    );
    await expect(sendSendGrid(full, 'S', 'B')).rejects.toThrow('invalid');
  });

  it('throws when the from address is not a verified sender', async () => {
    mockSgSend.mockRejectedValue(
      new Error('The from address does not match a verified Sender Identity'),
    );
    await expect(sendSendGrid(full, 'S', 'B')).rejects.toThrow('verified Sender');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('sendEmail (SMTP)', () => {
  beforeEach(() => vi.clearAllMocks());

  const full = {
    emailHost: 'smtp.example.com',
    emailPort: 587,
    emailUser: 'user@example.com',
    emailPass: 'secret',
    emailFrom: 'user@example.com',
    emailTo: 'sailor@example.com',
  };

  it('calls sendMail with correct arguments', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'abc' });
    await sendEmail(full, 'Subject', 'Body');
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: full.emailTo, subject: 'Subject' }),
    );
  });

  it('skips when emailHost is missing', async () => {
    await sendEmail({ emailUser: full.emailUser, emailTo: full.emailTo }, 'S', 'B');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('skips when emailTo is missing', async () => {
    await sendEmail({ emailHost: full.emailHost, emailUser: full.emailUser }, 'S', 'B');
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('sendWhatsApp (Twilio)', () => {
  beforeEach(() => vi.clearAllMocks());

  const full = {
    twilioSid: 'ACtest',
    twilioToken: 'token',
    twilioFrom: '+14155238886',
    twilioTo: '+49123456789',
  };

  it('calls twilio messages.create with whatsapp: prefix', async () => {
    mockTwilioCreate.mockResolvedValue({ sid: 'SM123' });
    await sendWhatsApp(full, 'Good wind!');
    expect(mockTwilioCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        from: `whatsapp:${full.twilioFrom}`,
        to: `whatsapp:${full.twilioTo}`,
        body: 'Good wind!',
      }),
    );
  });

  it('skips when twilioSid is missing', async () => {
    await sendWhatsApp({ twilioToken: full.twilioToken, twilioTo: full.twilioTo }, 'B');
    expect(mockTwilioCreate).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('sendTeams', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts to the webhook URL', async () => {
    mockAxiosPost.mockResolvedValue({ status: 200 });
    await sendTeams({ teamsWebhook: 'https://outlook.office.com/webhook/test' }, 'hello');
    expect(mockAxiosPost).toHaveBeenCalledWith(
      'https://outlook.office.com/webhook/test',
      { text: 'hello' },
    );
  });

  it('skips when teamsWebhook is missing', async () => {
    await sendTeams({}, 'hello');
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('notifyAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls SendGrid when configured', async () => {
    mockSgSend.mockResolvedValue([{ statusCode: 202 }]);
    await notifyAll(
      { sendgridApiKey: 'SG.k', sendgridFrom: 'f@x.com', sendgridTo: 't@x.com' },
      'Subject', 'Body',
    );
    expect(mockSgSend).toHaveBeenCalled();
  });

  it('does NOT throw when a channel errors — swallows and logs', async () => {
    mockSgSend.mockRejectedValue(new Error('SendGrid boom'));
    await expect(
      notifyAll(
        { sendgridApiKey: 'SG.k', sendgridFrom: 'f@x.com', sendgridTo: 't@x.com' },
        'Subject', 'Body',
      ),
    ).resolves.toBeUndefined();
  });

  it('fires all configured channels in parallel', async () => {
    mockSgSend.mockResolvedValue([{ statusCode: 202 }]);
    mockSendMail.mockResolvedValue({});
    await notifyAll(
      {
        sendgridApiKey: 'SG.k', sendgridFrom: 'f@x.com', sendgridTo: 'sg@x.com',
        emailHost: 'smtp.x.com', emailUser: 'u', emailTo: 'smtp@x.com',
      },
      'Subject', 'Body',
    );
    expect(mockSgSend).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalled();
  });
});
