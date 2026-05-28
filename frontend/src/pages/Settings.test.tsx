import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import SettingsPage from './Settings';

// The global axios mock from setup.ts provides defaults.
// Per-test overrides use vi.mocked().mockResolvedValueOnce().

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockResolvedValue({ data: {} });
  });

  it('renders all three tab buttons', async () => {
    render(<SettingsPage />);
    expect(screen.getByRole('button', { name: /Conditions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Channels/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Test/i })).toBeInTheDocument();
  });

  it('shows Sailing Thresholds heading on the Conditions tab by default', async () => {
    render(<SettingsPage />);
    expect(screen.getByText('Sailing Thresholds')).toBeInTheDocument();
  });

  it('loads settings from GET /api/settings on mount', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(vi.mocked(axios.get)).toHaveBeenCalledWith('/api/settings');
    });
  });

  it('clicking Test tab shows "Test All" button', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: /Test/i }));
    expect(screen.getByRole('button', { name: /Test All/i })).toBeInTheDocument();
  });

  it('clicking Test tab shows "Send Preview" button', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: /Test/i }));
    expect(screen.getByRole('button', { name: /Send Preview/i })).toBeInTheDocument();
  });

  it('Test tab shows all 4 channel labels (plus SendGrid/SMTP in preview section)', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: /Test/i }));
    // SendGrid and SMTP Email appear twice: once in "Test All", once in "Preview" section
    expect(screen.getAllByText('SendGrid')).toHaveLength(2);
    expect(screen.getAllByText('SMTP Email')).toHaveLength(2);
    expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByText(/Teams/i)).toBeInTheDocument();
  });

  it('"Test All" button calls POST /api/settings/test-notification', async () => {
    const user = userEvent.setup();
    vi.mocked(axios.post).mockResolvedValue({
      data: { sendgrid: 'skipped', email: 'skipped', whatsapp: 'skipped', teams: 'skipped' },
    });

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: /Test/i }));
    await user.click(screen.getByRole('button', { name: /Test All/i }));

    await waitFor(() => {
      expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
        '/api/settings/test-notification',
        expect.any(Object),
      );
    });
  });

  it('"Send Preview" button calls POST /api/settings/simulate-email', async () => {
    const user = userEvent.setup();
    vi.mocked(axios.post).mockResolvedValue({
      data: { sendgrid: 'skipped', email: 'skipped' },
    });

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: /Test/i }));
    await user.click(screen.getByRole('button', { name: /Send Preview/i }));

    await waitFor(() => {
      expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
        '/api/settings/simulate-email',
        expect.any(Object),
      );
    });
  });

  it('Save button calls POST /api/settings', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: /Save Settings/i }));

    await waitFor(() => {
      expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
        '/api/settings',
        expect.any(Object),
      );
    });
  });
});
