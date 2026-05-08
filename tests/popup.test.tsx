import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../src/popup/App';

describe('Popup App', () => {
  it('renders the SanityTV brand and loads settings', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /sanitytv/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText(/enable sanitytv/i)).toBeInTheDocument();
    });
  });

  it('shows the sensitivity slider with default value 50', async () => {
    render(<App />);
    const slider = await screen.findByLabelText(/sensitivity/i);
    expect((slider as HTMLInputElement).value).toBe('50');
  });

  it('shows hidden/greyed counters', async () => {
    render(<App />);
    expect(await screen.findByText(/hidden/)).toBeInTheDocument();
    expect(await screen.findByText(/greyed/)).toBeInTheDocument();
  });
});
