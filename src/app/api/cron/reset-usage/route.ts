import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Backfill: for existing free users with no free_period_ends_at, set it from created_at
  await sql`
    UPDATE users
    SET free_period_ends_at = created_at + INTERVAL '30 days'
    WHERE plan = 'free' AND free_period_ends_at IS NULL
  `;

  // Reset: for free users whose period has ended, roll forward and reset usage.
  // Rolls forward by however many full 30-day periods have elapsed since expiry,
  // so one cron run always brings the date back into the future regardless of lag.
  const reset = await sql`
    UPDATE users
    SET
      api_used_this_period = 0,
      free_period_ends_at = free_period_ends_at + (
        CEIL(EXTRACT(EPOCH FROM (NOW() - free_period_ends_at)) / (30.0 * 86400))::INTEGER
        * INTERVAL '30 days'
      )
    WHERE plan = 'free' AND free_period_ends_at <= NOW()
    RETURNING id
  `;

  return NextResponse.json({ reset: reset.length });
}
