import { NextRequest, NextResponse } from "next/server";
import { rewrite } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";
import { sql, ensureUsersTable } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  const userEmail = session?.user?.email;

  const anonUsed = request.cookies.get("polishly_anon_used")?.value === "1";

  if (!userEmail) {
    if (anonUsed) {
      return NextResponse.json(
        { error: "Sign in to continue polishing." },
        { status: 401 }
      );
    }
    // Anonymous first-time user — proceed without quota check
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

  let user: { id: number; api_used_this_period: number; api_quota_monthly: number } | undefined;

  if (userEmail) {
    await ensureUsersTable();

    // Ensure there's a users row for this authenticated email (works for OAuth and credentials users).
    let [row] =
      await sql`SELECT id, plan, api_quota_monthly, api_used_this_period FROM users WHERE email = ${userEmail}`;

    if (!row) {
      const inserted =
        await sql`
          INSERT INTO users (email, password)
          VALUES (${userEmail}, NULL)
          RETURNING id, plan, api_quota_monthly, api_used_this_period
        `;
      row = inserted[0];
    }

    if (row.api_used_this_period >= row.api_quota_monthly) {
      return NextResponse.json(
        {
          error:
            "You have reached your monthly API limit. Upgrade your plan or wait until your quota resets.",
        },
        { status: 402 }
      );
    }

    user = row;
  }

  try {
    const result = await rewrite(text, style);

    if (user) {
      await sql`
        UPDATE users
        SET api_used_this_period = api_used_this_period + 1
        WHERE id = ${user.id}
      `;
    }

    const response = NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });

    if (!userEmail) {
      response.cookies.set("polishly_anon_used", "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (error) {
    console.error("[rewrite] API error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to process text. Please try again." },
      { status: 500 }
    );
  }
}
