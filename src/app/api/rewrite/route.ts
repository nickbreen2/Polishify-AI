import { NextRequest, NextResponse } from "next/server";
import { rewrite } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
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

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { text } = body;

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

  try {
    const result = await rewrite(text);

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
