"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

type UserProfile = {
  plan: string;
  api_used_this_period: number;
  api_quota_monthly: number;
  billing_period_ends_at: string | null;
};

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const initial = email.charAt(0).toUpperCase();

  const [activeTab, setActiveTab] = useState<"settings" | "subscription">("settings");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [name, setName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<"pro" | "team" | null>(null);

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile)
      .catch(() => null)
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    if (user?.firstName) setName(user.firstName);
  }, [user]);

  async function handleSaveName() {
    if (!user) return;
    setNameSaving(true);
    try {
      await user.update({ firstName: name });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setNameSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error ?? "Failed to close account.");
        return;
      }
      await signOut({ redirectUrl: "/" });
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelError("");
    setCancelLoading(true);
    try {
      const res = await fetch("/api/billing/cancel-subscription", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setCancelError(data.error ?? "Failed to cancel subscription.");
        return;
      }
      setCancelSuccess(true);
    } catch {
      setCancelError("Something went wrong. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  }

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
        setCheckoutError(data.error ?? "Failed to start checkout.");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setCheckoutError("Unexpected error. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  const creditsLeft = profile
    ? profile.api_quota_monthly - profile.api_used_this_period
    : null;

  const renewalDate = profile?.billing_period_ends_at
    ? new Date(profile.billing_period_ends_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const daysUntilRenewal = profile?.billing_period_ends_at
    ? Math.ceil(
        (new Date(profile.billing_period_ends_at).getTime() - Date.now()) / 86400000
      )
    : null;

  function NavItem({ tab, label }: { tab: "settings" | "subscription"; label: string }) {
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
          activeTab === tab
            ? "bg-zinc-100 font-medium text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex min-h-screen pt-[57px]">
      {/* Sidebar — desktop */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-6 md:flex">
        <p className="px-3 pb-4 text-sm font-semibold text-zinc-900">Account settings</p>
        <div className="flex flex-col gap-0.5">
          <NavItem tab="settings" label="Settings" />
          <NavItem tab="subscription" label="Subscription" />
        </div>
        <div className="flex-1" />
        <div className="border-t border-zinc-200 pt-3">
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[#fafafa] px-4 py-8 md:px-10">
        {/* Mobile tab strip */}
        <div className="mb-6 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 md:hidden">
          {(["settings", "subscription"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium capitalize transition ${
                activeTab === tab ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold capitalize text-zinc-900">{activeTab}</h1>
          <span className="hidden text-sm text-zinc-400 md:block">{email}</span>
        </div>

        {activeTab === "settings" ? (
          <div className="flex max-w-2xl flex-col gap-4">
            {/* Profile card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold text-zinc-900">Profile</p>
              <p className="mt-0.5 text-xs text-zinc-400">Your account information</p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#456BFF] to-[#2548D2] text-lg font-semibold text-white">
                  {initial}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{email}</p>
                  {profileLoading ? (
                    <div className="mt-1 h-4 w-16 animate-pulse rounded bg-zinc-100" />
                  ) : (
                    <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-600">
                      {profile?.plan ?? "free"} Plan
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Name card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold text-zinc-900">Name</p>
              <p className="mt-0.5 text-xs text-zinc-400">Your full name</p>
              <div className="mt-5 flex gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  placeholder="Enter your full name"
                  className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving}
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                >
                  {nameSaved ? "Saved!" : nameSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {/* Connected accounts card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold text-zinc-900">Connected accounts</p>
              <p className="mt-0.5 text-xs text-zinc-400">Social accounts linked to your profile</p>
              <div className="mt-5">
                {user?.externalAccounts && user.externalAccounts.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {user.externalAccounts.map((account) => (
                      <div key={account.id} className="flex items-center gap-2 text-sm text-zinc-600">
                        <span className="capitalize">{account.provider}</span>
                        <span className="text-zinc-400">·</span>
                        <span>{account.emailAddress}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">No connected accounts</p>
                )}
              </div>
            </div>

            {/* Danger zone */}
            <div className="rounded-xl border border-red-200 bg-white p-6">
              <p className="text-sm font-semibold text-red-600">Danger zone</p>
              <p className="mt-0.5 text-xs text-zinc-400">Irreversible and destructive actions</p>
              <div className="mt-5 flex flex-col gap-3">
                <p className="text-sm font-medium text-zinc-900">Delete account</p>
                <p className="text-xs text-zinc-500">
                  Permanently delete your account and all data. This cannot be undone.
                </p>
                {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="flex w-full items-center justify-center rounded-xl border border-red-300 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Delete account
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-center text-xs text-zinc-500">
                      Are you sure? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        {deleteLoading ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          "Yes, delete"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Subscription tab */
          <div className="flex max-w-2xl flex-col gap-4">
            {/* Current plan card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold text-zinc-900">Current plan</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {profile?.plan === "free"
                  ? "You are on the free plan"
                  : `You are on the ${profile?.plan} plan`}
              </p>
              <div className="mt-5 flex items-center justify-between gap-4">
                {profileLoading ? (
                  <div className="h-8 w-48 animate-pulse rounded bg-zinc-100" />
                ) : (
                  <p className="text-2xl font-bold text-zinc-900">
                    {creditsLeft ?? "—"}
                    <span className="ml-2 text-base font-normal text-zinc-400">
                      credits left
                      {daysUntilRenewal !== null
                        ? ` · renews in ${daysUntilRenewal}d`
                        : " · Free plan"}
                      {renewalDate ? ` (${renewalDate})` : ""}
                    </span>
                  </p>
                )}

                {!profileLoading && profile?.plan === "free" && (
                  <button
                    onClick={() => startCheckout("pro")}
                    disabled={loadingPlan !== null}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60"
                  >
                    {loadingPlan === "pro" ? "Redirecting…" : "Go Pro"}
                    {loadingPlan !== "pro" && (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    )}
                  </button>
                )}

                {!profileLoading && (profile?.plan === "pro" || profile?.plan === "team") && (
                  cancelSuccess ? (
                    <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
                      Cancellation scheduled
                    </span>
                  ) : (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                      className="shrink-0 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-60"
                    >
                      {cancelLoading ? "Cancelling…" : "Cancel subscription"}
                    </button>
                  )
                )}
              </div>

              {cancelError && <p className="mt-3 text-xs text-red-500">{cancelError}</p>}
              {cancelSuccess && (
                <p className="mt-3 text-xs text-zinc-500">
                  Your subscription will be cancelled at the end of the billing period. You&apos;ll keep access until then.
                </p>
              )}
            </div>

            {/* Upgrade your plan card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold text-zinc-900">Upgrade your plan</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Get unlimited access to all models and features
              </p>

              {/* Billing toggle */}
              <div className="mt-5 flex w-fit items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    billingPeriod === "monthly"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    billingPeriod === "annual"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500"
                  }`}
                >
                  Annual
                  <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">
                    35% OFF
                  </span>
                </button>
              </div>

              {checkoutError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {checkoutError}
                </div>
              )}

              {/* Plan cards */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {/* Free */}
                <div className="flex flex-col rounded-xl border border-zinc-200 p-5">
                  <p className="text-sm font-semibold text-zinc-900">Free</p>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-3xl font-bold text-zinc-900">$0</span>
                    <span className="mb-1 text-xs text-zinc-400">/ month</span>
                  </div>
                  <ul className="mt-4 flex flex-col gap-2 text-xs text-zinc-600">
                    {[
                      "20 polishes / month",
                      "General writing",
                      "Prompt engineering",
                      "Chrome extension",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <CheckIcon />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <div className="block w-full rounded-xl border border-zinc-200 py-2.5 text-center text-sm font-medium text-zinc-400">
                      {profile?.plan === "free" ? "Current plan" : "Free plan"}
                    </div>
                  </div>
                </div>

                {/* Pro */}
                <div className="relative flex flex-col rounded-xl border-2 border-zinc-900 p-5">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-900 px-3 py-0.5 text-xs font-semibold text-white">
                    MOST POPULAR
                  </span>
                  <p className="text-sm font-semibold text-zinc-900">Pro</p>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-3xl font-bold text-zinc-900">
                      ${billingPeriod === "annual" ? "6" : "9"}
                    </span>
                    <span className="mb-1 text-xs text-zinc-400">/ month</span>
                  </div>
                  {billingPeriod === "annual" && (
                    <p className="text-xs text-zinc-400">Billed annually ($72/year)</p>
                  )}
                  <ul className="mt-4 flex flex-col gap-2 text-xs text-zinc-600">
                    {[
                      "200 polishes / month",
                      "All models (GPT-4o, Claude, Grok)",
                      "Advanced page analysis",
                      "Priority support",
                      "Early access to new features",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <CheckIcon />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    {profile?.plan === "pro" ? (
                      <div className="block w-full rounded-xl border border-zinc-200 py-2.5 text-center text-sm font-medium text-zinc-400">
                        Current plan
                      </div>
                    ) : (
                      <button
                        onClick={() => startCheckout("pro")}
                        disabled={loadingPlan !== null}
                        className="block w-full rounded-xl bg-zinc-900 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60"
                      >
                        {loadingPlan === "pro" ? "Redirecting…" : "Buy"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
