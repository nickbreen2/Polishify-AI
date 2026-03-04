import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT plan, api_used_this_period, api_quota_monthly, billing_period_ends_at
    FROM users WHERE email = ${userEmail}
  `;
  const user = rows[0];

  // User row may not exist yet for new OAuth users — return free plan defaults
  return NextResponse.json({
    plan: user?.plan ?? "free",
    api_used_this_period: user?.api_used_this_period ?? 0,
    api_quota_monthly: user?.api_quota_monthly ?? 20,
    billing_period_ends_at: user?.billing_period_ends_at ?? null,
  });
}
