// WARNING: This in-memory store is NOT durable. It resets on every serverless
// cold start, so the rate limit can be bypassed simply by triggering a new
// function instance. For production-grade rate limiting, replace this with a
// persistent store such as @upstash/ratelimit + @upstash/redis or Vercel KV.
const store = new Map<string, { count: number; resetAt: number }>();

const MAX_REQUESTS = 10;
const WINDOW_MS = 60_000;

export function rateLimit(key: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  return { ok: true, remaining: MAX_REQUESTS - entry.count };
}
