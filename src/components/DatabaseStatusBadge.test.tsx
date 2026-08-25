import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// We need to mock the entire module to change the exported variable
vi.mock('../lib/supabase', () => ({
  databaseMode: 'mock' // default mock value
}));

describe('DatabaseStatusBadge', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in mock mode', async () => {
    // Override the mock for this specific test to simulate 'mock' mode
    vi.doMock('../lib/supabase', () => ({
      databaseMode: 'mock'
    }));

    // Re-import the component so it uses the newly mocked value
    const { DatabaseStatusBadge: MockBadge } = await import('./DatabaseStatusBadge');

    render(<MockBadge />);

    const badge = screen.getByTestId('status-database-mode');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('🔴 Using Mock Fallback');
    expect(badge).toHaveClass('status-badge--mock');
    expect(badge).toHaveAttribute('aria-label', 'Using Mock Fallback');
  });

  it('renders correctly in live mode', async () => {
    // Override the mock for this specific test to simulate 'live' mode
    vi.doMock('../lib/supabase', () => ({
      databaseMode: 'live'
    }));

    // Re-import the component so it uses the newly mocked value
    const { DatabaseStatusBadge: LiveBadge } = await import('./DatabaseStatusBadge');

    render(<LiveBadge />);

    const badge = screen.getByTestId('status-database-mode');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('🟢 Supabase Live');
    expect(badge).toHaveClass('status-badge--live');
    expect(badge).toHaveAttribute('aria-label', 'Supabase Live');
  });
});
