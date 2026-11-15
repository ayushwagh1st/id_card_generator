interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const localRateLimitMap = new Map<string, RateLimitTracker>();

export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 10000 // default 10 seconds
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  
  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    for (const [key, tracker] of localRateLimitMap.entries()) {
      if (now > tracker.resetAt) {
        localRateLimitMap.delete(key);
      }
    }
  }

  let tracker = localRateLimitMap.get(identifier);

  if (!tracker || now > tracker.resetAt) {
    tracker = { count: 1, resetAt: now + windowMs };
    localRateLimitMap.set(identifier, tracker);
    return { success: true, limit, remaining: limit - 1, reset: tracker.resetAt };
  }

  tracker.count += 1;

  if (tracker.count > limit) {
    return { success: false, limit, remaining: 0, reset: tracker.resetAt };
  }

  return { success: true, limit, remaining: limit - tracker.count, reset: tracker.resetAt };
}
