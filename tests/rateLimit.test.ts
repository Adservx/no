import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimiter } from '../utils/rateLimit';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Reset all rate limits before each test
    rateLimiter.reset('test:action');
  });

  it('should allow requests within limit', () => {
    rateLimiter.configure('test:action', 3, 1000);

    expect(rateLimiter.isAllowed('test:action')).toBe(true);
    expect(rateLimiter.isAllowed('test:action')).toBe(true);
    expect(rateLimiter.isAllowed('test:action')).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    rateLimiter.configure('test:action', 2, 1000);

    expect(rateLimiter.isAllowed('test:action')).toBe(true);
    expect(rateLimiter.isAllowed('test:action')).toBe(true);
    expect(rateLimiter.isAllowed('test:action')).toBe(false);
  });

  it('should allow requests after window expires', async () => {
    rateLimiter.configure('test:action', 2, 100); // 100ms window

    expect(rateLimiter.isAllowed('test:action')).toBe(true);
    expect(rateLimiter.isAllowed('test:action')).toBe(true);
    expect(rateLimiter.isAllowed('test:action')).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(rateLimiter.isAllowed('test:action')).toBe(true);
  });

  it('should return time until next allowed request', () => {
    rateLimiter.configure('test:action', 1, 1000);

    rateLimiter.isAllowed('test:action');

    const timeUntil = rateLimiter.getTimeUntilAllowed('test:action');
    expect(timeUntil).toBeGreaterThan(0);
    expect(timeUntil).toBeLessThanOrEqual(1000);
  });

  it('should handle unconfigured actions', () => {
    expect(rateLimiter.isAllowed('unconfigured:action')).toBe(true);
    expect(rateLimiter.getTimeUntilAllowed('unconfigured:action')).toBe(0);
  });

  it('should reset rate limit for specific action', () => {
    rateLimiter.configure('test:action', 1, 1000);

    expect(rateLimiter.isAllowed('test:action')).toBe(true);
    expect(rateLimiter.isAllowed('test:action')).toBe(false);

    rateLimiter.reset('test:action');

    expect(rateLimiter.isAllowed('test:action')).toBe(true);
  });
});
