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
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="flex min-h-screen flex-col">
        <Navbar />

        {/* Spacer for fixed nav */}
        <div className="h-[57px]" />

        <main className="flex flex-1 flex-col items-center px-8 py-20">
        <h1 className="mb-2 text-center text-4xl font-bold tracking-tight text-zinc-900">
          Pricing
        </h1>
        <p className="mb-12 text-center text-sm text-zinc-500">Simple, transparent pricing. No surprises.</p>

        {checkoutError && (
          <div className="mb-6 w-full max-w-4xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {checkoutError}
          </div>
        )}

        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">

          {/* Free */}
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Free</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-bold text-zinc-900">$0</span>
              <span className="mb-1 text-sm text-zinc-400">/mo</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">Get started at no cost.</p>
            <ul className="mt-6 flex flex-col gap-2.5 text-sm text-zinc-600">
              {["20 polishes / month", "General writing", "Prompt engineering", "Chrome extension"].map((f) => (
                <li key={f} className="flex items-center gap-2"><CheckIcon />{f}</li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <div className="block w-full rounded-xl border border-zinc-200 py-2.5 text-center text-sm font-semibold text-zinc-400">
                Current plan
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-xl border-2 border-brand bg-white p-6 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
              Most popular
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">Pro</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-bold text-zinc-900">$9</span>
              <span className="mb-1 text-sm text-zinc-400">/mo</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">For power users who write a lot.</p>
            <ul className="mt-6 flex flex-col gap-2.5 text-sm text-zinc-600">
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
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Team</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-bold text-zinc-900">$29</span>
              <span className="mb-1 text-sm text-zinc-400">/mo</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">For teams that communicate together.</p>
            <ul className="mt-6 flex flex-col gap-2.5 text-sm text-zinc-600">
              {["800 polishes / month", "Everything in Pro", "Up to 10 seats", "Shared usage dashboard", "Team billing", "Priority support"].map((f) => (
                <li key={f} className="flex items-center gap-2"><CheckIcon />{f}</li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={() => startCheckout("team")}
                disabled={loadingPlan !== null}
                className="block w-full rounded-xl border border-zinc-300 py-2.5 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
              >
                {loadingPlan === "team" ? "Redirecting…" : "Upgrade to Team"}
              </button>
            </div>
          </div>

        </div>
        </main>

        {/* Footer — same structure as Polish page */}
        <footer className="w-full border-t border-zinc-200">
          <div className="flex w-full flex-col items-center gap-4 px-4 py-4 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span className="text-center sm:text-left">Built by the Polishify team — free &amp; open source</span>
            <a
              href="https://github.com/nickbreen2/Polishify-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
                fill="currentColor"
              >
                <title>GitHub</title>
                <path
                  fillRule="evenodd"
                  d="M12 0c6.63 0 12 5.276 12 11.79-.001 5.067-3.29 9.567-8.175 11.187-.6.118-.825-.25-.825-.56 0-.398.015-1.665.015-3.242 0-1.105-.375-1.813-.81-2.181 2.67-.295 5.475-1.297 5.475-5.822 0-1.297-.465-2.344-1.23-3.169.12-.295.54-1.503-.12-3.125 0 0-1.005-.324-3.3 1.209a11.32 11.32 0 00-3-.398c-1.02 0-2.04.133-3 .398-2.295-1.518-3.3-1.209-3.3-1.209-.66 1.622-.24 2.83-.12 3.125-.765.825-1.23 1.887-1.23 3.169 0 4.51 2.79 5.527 5.46 5.822-.345.294-.66.81-.765 1.577-.69.31-2.415.81-3.495-.973-.225-.354-.9-1.223-1.845-1.209-1.005.015-.405.56.015.781.51.28 1.095 1.327 1.23 1.666.24.663 1.02 1.93 4.035 1.385 0 .988.015 1.916.015 2.196 0 .31-.225.664-.825.56C3.303 21.374-.003 16.867 0 11.791 0 5.276 5.37 0 12 0z"
                />
              </svg>
              Contribute on GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
