/**
 * Simple client-side rate limiter
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { maxRequests: number; windowMs: number }> = new Map();

  /**
   * Configure rate limit for an action
   */
  configure(action: string, maxRequests: number, windowMs: number) {
    this.limits.set(action, { maxRequests, windowMs });
  }

  /**
   * Check if action is allowed
   */
  isAllowed(action: string): boolean {
    const limit = this.limits.get(action);
    if (!limit) return true;

    const now = Date.now();
    const requests = this.requests.get(action) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < limit.windowMs);

    if (validRequests.length >= limit.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(action, validRequests);

    return true;
  }

  /**
   * Get time until next allowed request
   */
  getTimeUntilAllowed(action: string): number {
    const limit = this.limits.get(action);
    if (!limit) return 0;

    const requests = this.requests.get(action) || [];
    if (requests.length < limit.maxRequests) return 0;

    const oldestRequest = requests[0];
    const timeUntilExpiry = limit.windowMs - (Date.now() - oldestRequest);

    return Math.max(0, timeUntilExpiry);
  }

  /**
   * Reset rate limit for an action
   */
  reset(action: string) {
    this.requests.delete(action);
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Configure default limits
rateLimiter.configure('post:create', 5, 60000); // 5 posts per minute
rateLimiter.configure('comment:create', 10, 60000); // 10 comments per minute
rateLimiter.configure('like:toggle', 30, 60000); // 30 likes per minute
rateLimiter.configure('file:upload', 10, 300000); // 10 uploads per 5 minutes
rateLimiter.configure('profile:update', 3, 60000); // 3 profile updates per minute
