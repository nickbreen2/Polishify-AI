import { NextRequest, NextResponse } from "next/server";
import { getClarifyingQuestions } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, ensureUsersTable } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

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

  let body: { text?: string; polishedText?: string; detectedMode?: string; grade?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { text, polishedText, detectedMode, grade } = body;

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

  const polished =
    typeof polishedText === "string" && polishedText.trim().length > 0
      ? polishedText.trim()
      : undefined;
  if (polished && polished.length > 10_000) {
    return NextResponse.json(
      { error: "Polished text too long. Maximum 10,000 characters." },
      { status: 400 }
    );
  }

  let user: { id: number; api_used_this_period: number; api_quota_monthly: number } | undefined;

  if (userId) {
    await ensureUsersTable();

    let [row] =
      await sql`SELECT id, plan, api_quota_monthly, api_used_this_period FROM users WHERE clerk_user_id = ${userId}`;

    if (!row) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;
      const inserted = await sql`
        INSERT INTO users (clerk_user_id, email)
        VALUES (${userId}, ${email})
        ON CONFLICT (email) DO UPDATE SET clerk_user_id = ${userId}
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

    user = row as { id: number; api_used_this_period: number; api_quota_monthly: number };
  }

  try {
    const validModes = ["prompt", "professional", "creative", "casual"] as const;
    type ValidMode = (typeof validModes)[number];
    const normalizedMode: ValidMode = validModes.includes(detectedMode as ValidMode)
      ? (detectedMode as ValidMode)
      : "professional";
    const result = await getClarifyingQuestions(text, polished, normalizedMode, grade as import("@/lib/anthropic").GradeResult | undefined);

    if (user) {
      await sql`
        UPDATE users
        SET api_used_this_period = api_used_this_period + 1
        WHERE id = ${user.id}
      `;
    }

    return NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (error) {
    console.error("[clarify] API error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to get clarifying questions. Please try again." },
      { status: 500 }
    );
  }
}
