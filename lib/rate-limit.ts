import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const localRateLimitMap = new Map<string, RateLimitTracker>();
const upstashRateLimiters = new Map<string, Ratelimit>();

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

function getUpstashLimiter(limit: number, windowMs: number) {
  const key = `${limit}_${windowMs}`
  if (!upstashRateLimiters.has(key)) {
    const windowSec = Math.max(1, Math.floor(windowMs / 1000))
    upstashRateLimiters.set(key, new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s` as any),
      ephemeralCache: new Map(),
    }))
  }
  return upstashRateLimiters.get(key)!
}

export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 10000 // default 10 seconds
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  
  if (hasUpstash) {
    try {
      const limiter = getUpstashLimiter(limit, windowMs)
      const { success, limit: upstashLimit, remaining, reset } = await limiter.limit(identifier)
      return { success, limit: upstashLimit, remaining, reset }
    } catch (error) {
      console.error('Upstash Rate Limiting Error:', error)
      // Fallback to local if Upstash fails temporarily
    }
  }

  // Local In-Memory Fallback
  const now = Date.now();
  
  // Cleanup old entries periodically (every 100 calls to prevent memory leak)
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
