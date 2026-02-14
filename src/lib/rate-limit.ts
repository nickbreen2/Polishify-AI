const windowMs = 60_000; // 1 minute
const maxRequests = 10;

const hits = new Map<string, number[]>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) hits.delete(key);
    else hits.set(key, valid);
  }
}, 5 * 60_000);

export function rateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    hits.set(ip, timestamps);
    return { ok: false, remaining: 0 };
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
  return { ok: true, remaining: maxRequests - timestamps.length };
}
