import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok } = await rateLimit(`delete-account:${userId}`, 3, 60_000);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  await sql`DELETE FROM users WHERE clerk_user_id = ${userId}`;

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return NextResponse.json({ ok: true });
}
