import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, ensureUsersTable } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok } = await rateLimit(`checkout:${userId}`, 5, 60_000);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: { plan?: "pro" | "team" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const plan = body.plan ?? "pro";
  const priceId =
    plan === "team"
      ? process.env.STRIPE_PRICE_TEAM_MONTHLY
      : process.env.STRIPE_PRICE_PRO_MONTHLY;

  if (!priceId) {
    return NextResponse.json({ error: "Missing Stripe price ID" }, { status: 500 });
  }

  try {
    await ensureUsersTable();

    let [user] =
      await sql`SELECT id, stripe_customer_id FROM users WHERE clerk_user_id = ${userId}`;

    if (!user) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;
      const inserted = await sql`
        INSERT INTO users (clerk_user_id, email)
        VALUES (${userId}, ${email})
        ON CONFLICT (email) DO UPDATE SET clerk_user_id = ${userId}
        RETURNING id, stripe_customer_id
      `;
      user = inserted[0];
    }

    let customerId = user.stripe_customer_id as string | null;
    if (!customerId) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses[0]?.emailAddress ?? undefined;
      const customer = await stripe.customers.create({
        email,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id;
      await sql`
        UPDATE users
        SET stripe_customer_id = ${customerId}
        WHERE id = ${user.id}
      `;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/billing/success`,
      cancel_url: `${req.nextUrl.origin}/pricing`,
      metadata: { userId: String(user.id), plan },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[checkout] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown checkout error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
