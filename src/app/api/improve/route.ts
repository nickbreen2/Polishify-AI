import { NextRequest, NextResponse } from "next/server";
import { improveWithContext } from "@/lib/anthropic";
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

  let body: {
    text?: string;
    mode?: string;
    polishedText?: string;
    answers?: unknown;
    grade?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { text, mode, polishedText, answers } = body;

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

  const validModes = ["prompt", "professional", "creative", "casual"] as const;
  const selectedMode = validModes.includes(mode as (typeof validModes)[number])
    ? (mode as (typeof validModes)[number])
    : "professional";

  const answersList = Array.isArray(answers)
    ? (answers as unknown[]).filter((a) => typeof a === "string")
    : [];

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

  await ensureUsersTable();

  let [user] =
    await sql`SELECT id, plan, api_quota_monthly, api_used_this_period FROM users WHERE email = ${userEmail}`;

  if (!user) {
    const inserted =
      await sql`
        INSERT INTO users (email, password)
        VALUES (${userEmail}, NULL)
        RETURNING id, plan, api_quota_monthly, api_used_this_period
      `;
    user = inserted[0];
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
    const result = await improveWithContext(text, selectedMode, {
      polishedText: polished,
      answers: answersList,
      grade: body.grade as import("@/lib/anthropic").GradeResult | undefined,
    });

    await sql`
      UPDATE users
      SET api_used_this_period = api_used_this_period + 1
      WHERE id = ${user.id}
    `;

    return NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (error) {
    console.error("[improve] API error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to improve text. Please try again." },
      { status: 500 }
    );
  }
}
