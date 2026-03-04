"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

type UserProfile = {
  plan: string;
  api_used_this_period: number;
  api_quota_monthly: number;
  billing_period_ends_at: string | null;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#456BFF] focus:ring-2 focus:ring-[#456BFF]/20"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

export function SettingsModal({ onClose, email }: { onClose: () => void; email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Failed to change password.");
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setPasswordLoading(false);
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
      await signOut({ redirect: false });
      window.location.href = "/";
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

          {/* Change password */}
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-900">Change password</p>

            <PasswordInput value={currentPassword} onChange={setCurrentPassword} placeholder="Current password" />
            <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="New password (8+ characters)" />
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm new password" />

            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            {passwordSuccess && <p className="text-xs text-green-600">Password updated successfully.</p>}

            <button
              type="submit"
              disabled={passwordLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#456BFF] to-[#2548D2] py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {passwordLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : "Update password"}
            </button>
          </form>

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
