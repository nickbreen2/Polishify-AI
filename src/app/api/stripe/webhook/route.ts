import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0]?.price?.id;
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      let plan: "free" | "pro" | "team" = "free";
      let quota = 20;

      if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) {
        plan = "pro";
        quota = 1000;
      } else if (priceId === process.env.STRIPE_PRICE_TEAM_MONTHLY) {
        plan = "team";
        quota = 10000;
      }

      await sql`
        UPDATE users
        SET
          plan = ${plan},
          api_quota_monthly = ${quota},
          api_used_this_period = 0,
          billing_period_ends_at = ${currentPeriodEnd},
          stripe_customer_id = ${customerId}
        WHERE stripe_customer_id = ${customerId}
      `;
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await sql`
        UPDATE users
        SET
          plan = 'free',
          api_quota_monthly = 20,
          api_used_this_period = 0,
          billing_period_ends_at = NULL
        WHERE stripe_customer_id = ${customerId}
      `;
    }
  } catch (err) {
    console.error("Error handling Stripe webhook", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

