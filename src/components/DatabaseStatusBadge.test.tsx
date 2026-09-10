import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

describe('DatabaseStatusBadge', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly in mock mode', async () => {
    vi.doMock('../lib/supabase', () => ({
      databaseMode: 'mock'
    }));

    const { DatabaseStatusBadge } = await import('./DatabaseStatusBadge');

    render(<DatabaseStatusBadge />);

    const badge = screen.getByRole('status');
    expect(badge.className).toContain('status-badge--mock');
    expect(badge.textContent).toContain('Using Mock Fallback');
    expect(badge.getAttribute('aria-label')).toBe('Database connection status: Using Mock Fallback');
  });

  it('renders correctly in live mode', async () => {
    vi.doMock('../lib/supabase', () => ({
      databaseMode: 'live'
    }));

    const { DatabaseStatusBadge } = await import('./DatabaseStatusBadge');

    render(<DatabaseStatusBadge />);

    const badge = screen.getByRole('status');
    expect(badge.className).toContain('status-badge--live');
    expect(badge.textContent).toContain('Supabase Live');
    expect(badge.getAttribute('aria-label')).toBe('Database connection status: Supabase Live');
  });
});
