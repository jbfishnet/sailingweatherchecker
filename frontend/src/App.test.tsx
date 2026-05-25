import { render, screen, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App Smoke Test', () => {
  it('renders the main heading', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText(/Sailing Weather/i)).toBeInTheDocument();
  });
});
