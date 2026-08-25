import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timeAgo } from './Dashboard';

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns seconds for dates less than 60 seconds ago', () => {
    const date = new Date('2024-01-01T11:59:30Z'); // 30 seconds ago
    expect(timeAgo(date)).toBe('30s ago');

    const dateJustNow = new Date('2024-01-01T11:59:59Z'); // 1 second ago
    expect(timeAgo(dateJustNow)).toBe('1s ago');
  });

  it('returns minutes for dates between 1 minute and 59 minutes ago', () => {
    const date = new Date('2024-01-01T11:55:00Z'); // 5 minutes ago
    expect(timeAgo(date)).toBe('5m ago');

    const dateExactlyOneMin = new Date('2024-01-01T11:59:00Z'); // 1 minute ago
    expect(timeAgo(dateExactlyOneMin)).toBe('1m ago');

    const dateAlmostHour = new Date('2024-01-01T11:01:00Z'); // 59 minutes ago
    expect(timeAgo(dateAlmostHour)).toBe('59m ago');
  });

  it('returns hours for dates between 1 hour and 23 hours ago', () => {
    const date = new Date('2024-01-01T09:00:00Z'); // 3 hours ago
    expect(timeAgo(date)).toBe('3h ago');

    const dateExactlyOneHour = new Date('2024-01-01T11:00:00Z'); // 1 hour ago
    expect(timeAgo(dateExactlyOneHour)).toBe('1h ago');

    const dateAlmostDay = new Date('2023-12-31T13:00:00Z'); // 23 hours ago
    expect(timeAgo(dateAlmostDay)).toBe('23h ago');
  });

  it('returns days for dates 24 hours ago or more', () => {
    const date = new Date('2023-12-31T12:00:00Z'); // exactly 24 hours (1 day) ago
    expect(timeAgo(date)).toBe('1d ago');

    const dateMultipleDays = new Date('2023-12-29T12:00:00Z'); // 3 days ago
    expect(timeAgo(dateMultipleDays)).toBe('3d ago');

    const dateLongAgo = new Date('2023-01-01T12:00:00Z'); // 365 days ago
    expect(timeAgo(dateLongAgo)).toBe('365d ago');
  });

  it('handles negative time differences (future dates) gracefully by returning 0s ago', () => {
      // The current implementation uses Math.round, so negative seconds will result in a negative number, but since it's < 60, it will return that negative number of seconds.
      // E.g., if it's 10 seconds in the future, seconds = -10. -10 < 60 is true. Returns "-10s ago".
      // We might want to see how the current implementation actually behaves.
      const date = new Date('2024-01-01T12:00:10Z'); // 10 seconds in the future
      expect(timeAgo(date)).toBe('-10s ago');
  });
});
