"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";

function CheckIcon({ brand }: { brand?: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${brand ? "text-brand" : "text-zinc-400"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PricingPage() {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<"pro" | "team" | null>(null);

  async function startCheckout(plan: "pro" | "team") {
    setCheckoutError(null);
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok) {
        console.error("Failed to start checkout", data.error);
        setCheckoutError(data.error ?? "Failed to start checkout. Please try again.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Unexpected error starting checkout", error);
      setCheckoutError("Unexpected error. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <Navbar />

      {/* Spacer for fixed nav */}
      <div className="h-[57px]" />

      <main className="flex flex-col items-center px-8 py-20">
        <h1 className="mb-2 text-center text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Pricing
        </h1>
        <p className="mb-12 text-center text-sm text-zinc-500">Simple, transparent pricing. No surprises.</p>

        {checkoutError && (
          <div className="mb-6 w-full max-w-4xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {checkoutError}
          </div>
        )}

        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">

          {/* Free */}
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Free</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white">$0</span>
              <span className="mb-1 text-sm text-zinc-400">/mo</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">Get started at no cost.</p>
            <ul className="mt-6 flex flex-col gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              {["20 polishes / month", "General writing", "Prompt engineering", "Chrome extension"].map((f) => (
                <li key={f} className="flex items-center gap-2"><CheckIcon />{f}</li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <div className="block w-full rounded-xl border border-zinc-200 py-2.5 text-center text-sm font-semibold text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                Current plan
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-xl border-2 border-brand bg-white p-6 shadow-lg dark:bg-zinc-900">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
              Most popular
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">Pro</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white">$9</span>
              <span className="mb-1 text-sm text-zinc-400">/mo</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">For power users who write a lot.</p>
            <ul className="mt-6 flex flex-col gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              {["200 polishes / month", "General writing", "Prompt engineering", "Chrome extension", "Priority AI processing"].map((f) => (
                <li key={f} className="flex items-center gap-2"><CheckIcon brand />{f}</li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={() => startCheckout("pro")}
                disabled={loadingPlan !== null}
                className="block w-full rounded-xl bg-gradient-to-b from-[#456BFF] to-[#2548D2] py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
              >
                {loadingPlan === "pro" ? "Redirecting…" : "Upgrade to Pro"}
              </button>
            </div>
          </div>

          {/* Team */}
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Team</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white">$29</span>
              <span className="mb-1 text-sm text-zinc-400">/mo</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">For teams that communicate together.</p>
            <ul className="mt-6 flex flex-col gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              {["800 polishes / month", "Everything in Pro", "Up to 10 seats", "Shared usage dashboard", "Team billing", "Priority support"].map((f) => (
                <li key={f} className="flex items-center gap-2"><CheckIcon />{f}</li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={() => startCheckout("team")}
                disabled={loadingPlan !== null}
                className="block w-full rounded-xl border border-zinc-300 py-2.5 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-60"
              >
                {loadingPlan === "team" ? "Redirecting…" : "Upgrade to Team"}
              </button>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
        Chrome extension — free &amp; open source
      </footer>
    </div>
  );
}
