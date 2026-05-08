import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../src/popup/App';

describe('Popup App', () => {
  it('renders the SanityTV brand', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /sanitytv/i })).toBeInTheDocument();
  });
});
