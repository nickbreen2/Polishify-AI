import { sql } from "@/lib/db";

// One-time table creation per serverless instance lifecycle.
// The table persists in Neon across all function instances, so rate limits
// are never reset by cold starts.
let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      reset_at TIMESTAMPTZ NOT NULL
    )
  `;
  tableReady = true;
}

export async function rateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60_000
): Promise<{ ok: boolean; remaining: number }> {
  try {
    await ensureTable();
    const resetAt = new Date(Date.now() + windowMs);
    const rows = await sql`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.reset_at <= NOW() THEN 1
          ELSE rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN rate_limits.reset_at <= NOW() THEN ${resetAt}
          ELSE rate_limits.reset_at
        END
      RETURNING count
    `;
    const count = (rows[0]?.count as number) ?? 1;
    return { ok: count <= maxRequests, remaining: Math.max(0, maxRequests - count) };
  } catch {
    // On DB error, allow the request through to avoid a total outage
    return { ok: true, remaining: 1 };
  }
}
