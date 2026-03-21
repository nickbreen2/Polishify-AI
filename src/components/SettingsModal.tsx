"use client";

import { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

type UserProfile = {
  plan: string;
  api_used_this_period: number;
  api_quota_monthly: number;
  billing_period_ends_at: string | null;
};

export function SettingsModal({ onClose, email }: { onClose: () => void; email: string }) {
  const { signOut } = useClerk();

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setProfile(data))
      .catch(() => null)
      .finally(() => setProfileLoading(false));
  }, []);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Account Settings</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Account info */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Account</p>
            <p className="text-sm text-gray-700">{email}</p>
          </div>

          <div className="border-t border-gray-100" />

          {/* Credits */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Credits</p>
              {profileLoading ? (
                <span className="h-4 w-12 animate-pulse rounded bg-gray-100" />
              ) : profile ? (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 capitalize">
                  {profile.plan}
                </span>
              ) : null}
            </div>

            {profileLoading ? (
              <div className="flex flex-col gap-2">
                <div className="h-2 w-full animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
              </div>
            ) : profile ? (
              <div className="flex flex-col gap-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#456BFF] to-[#2548D2] transition-all"
                    style={{ width: `${Math.min(100, (profile.api_used_this_period / profile.api_quota_monthly) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {profile.api_used_this_period} / {profile.api_quota_monthly} credits used this month
                  </p>
                  {profile.plan === "free" && (
                    <a href="/pricing" onClick={onClose} className="text-xs font-medium text-[#456BFF] hover:underline">
                      Upgrade
                    </a>
                  )}
                </div>
                {profile.billing_period_ends_at && (
                  <p className="text-xs text-gray-400">
                    Resets {new Date(profile.billing_period_ends_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="border-t border-gray-100" />

          {/* Close account */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-900">Close account</p>
            <p className="text-xs text-gray-500">Permanently delete your account and all data. This cannot be undone.</p>

            {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex w-full items-center justify-center rounded-xl border border-red-300 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Close my account
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-center text-xs text-gray-500">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
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
                    ) : "Yes, delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
