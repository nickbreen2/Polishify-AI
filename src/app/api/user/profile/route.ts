import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok } = await rateLimit(`profile:${userId}`, 30, 60_000);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const rows = await sql`
    SELECT plan, api_used_this_period, api_quota_monthly, billing_period_ends_at, free_period_ends_at
    FROM users WHERE clerk_user_id = ${userId}
  `;
  const user = rows[0];

  // User row may not exist yet for new users — return free plan defaults
  return NextResponse.json({
    plan: user?.plan ?? "free",
    api_used_this_period: user?.api_used_this_period ?? 0,
    api_quota_monthly: user?.api_quota_monthly ?? 20,
    billing_period_ends_at: user?.billing_period_ends_at ?? null,
    free_period_ends_at: user?.free_period_ends_at ?? null,
  });
}
