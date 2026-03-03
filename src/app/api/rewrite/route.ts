import { NextRequest, NextResponse } from "next/server";
import { rewrite } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";
import { sql, ensureUsersTable } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json(
      { error: "You must be signed in to use Polishify." },
      { status: 401 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const { ok, remaining } = rateLimit(ip);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "X-RateLimit-Remaining": "0" },
      }
    );
  }

  let body: { text?: string; style?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { text, style } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty 'text' field." },
      { status: 400 }
    );
  }

  if (text.length > 10_000) {
    return NextResponse.json(
      { error: "Text too long. Maximum 10,000 characters." },
      { status: 400 }
    );
  }

  await ensureUsersTable();

  const [user] =
    await sql`SELECT id, plan, api_quota_monthly, api_used_this_period FROM users WHERE email = ${userEmail}`;

  if (!user) {
    return NextResponse.json(
      { error: "User account not found." },
      { status: 404 }
    );
  }

  if (user.api_used_this_period >= user.api_quota_monthly) {
    return NextResponse.json(
      {
        error:
          "You have reached your monthly API limit. Upgrade your plan or wait until your quota resets.",
      },
      { status: 402 }
    );
  }

  try {
    const result = await rewrite(text, style);

    await sql`
      UPDATE users
      SET api_used_this_period = api_used_this_period + 1
      WHERE id = ${user.id}
    `;

    return NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (error) {
    console.error("[rewrite] API error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to process text. Please try again." },
      { status: 500 }
    );
  }
}
