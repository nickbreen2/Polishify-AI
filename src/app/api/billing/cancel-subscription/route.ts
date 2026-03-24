import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok } = await rateLimit(`cancel-subscription:${userId}`, 5, 60_000);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const rows = await sql`
    SELECT stripe_customer_id FROM users WHERE clerk_user_id = ${userId}
  `;
  const user = rows[0];

  if (!user?.stripe_customer_id) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  const customerId = user.stripe_customer_id as string;

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  const subscriptionId = subscriptions.data[0].id;

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return NextResponse.json({ ok: true });
}
