import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { sql, ensureUsersTable } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  await ensureUsersTable();

  const rows =
    await sql`SELECT id, stripe_customer_id FROM users WHERE email = ${session.user.email}`;
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let customerId = user.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
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
}

