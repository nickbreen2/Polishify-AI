"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useAuthModal } from "./AuthModalContext";
import { SettingsModal } from "./SettingsModal";

const TABS = [
  { label: "Polish", href: "/#polish" },
  { label: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const [active, setActive] = useState(() =>
    pathname === "/pricing" ? "Pricing" : "Polish"
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const { open } = useAuthModal();

  const email = session?.user?.email ?? "";
  const initial = email.charAt(0).toUpperCase();

  useEffect(() => {
    const el = document.getElementById("polish");
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive("Polish"); },
      { threshold: 0.2, rootMargin: "-80px 0px -40% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Close settings popover on outside click
  useEffect(() => {
    if (!showSettings) return;
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  return (
    <>
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-[#fafafa]">
      <div className="flex items-center justify-between px-6 py-3.5 md:px-8">
        {/* Logo */}
        <a href="/">
          <img
            src="/Polishify_Full_Logo.png"
            alt="Polishify"
            className="h-7 w-auto object-contain"
          />
        </a>

        {/* Center pill — desktop only */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full border border-zinc-200 bg-zinc-100 p-1 md:flex">
          {TABS.map((tab) => (
            <a
              key={tab.label}
              href={tab.href}
              onClick={() => setActive(tab.label)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                active === tab.label
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {/* Right — desktop only */}
        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <div ref={settingsRef} className="relative">
              <button
                onClick={() => setShowSettings((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#456BFF] to-[#2548D2] text-sm font-semibold text-white transition hover:opacity-95"
              >
                {initial}
              </button>

              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate text-xs text-gray-500">{email}</p>
                  </div>
                  <a
                    href="/pricing"
                    onClick={() => setShowSettings(false)}
                    className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm text-gray-700">Plan</span>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">Free</span>
                  </a>
                  <button
                    onClick={() => { setShowSettings(false); setShowSettingsModal(true); }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    Settings
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={() => signOut({ redirect: false })}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => open("signin")}
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
              >
                Sign in
              </button>
              <div className="h-4 w-px bg-zinc-200" />
              <button
                onClick={() => open("signup")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#456BFF] to-[#2548D2] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Sign up
              </button>
            </>
          )}
        </div>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-200 bg-[#fafafa] px-6 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-3">
            {TABS.map((tab) => (
              <a
                key={tab.label}
                href={tab.href}
                onClick={() => { setActive(tab.label); setMobileMenuOpen(false); }}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active === tab.label
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                {tab.label}
              </a>
            ))}
            <div className="my-2 border-t border-zinc-200" />
            {session ? (
              <>
                <p className="truncate px-3 py-1 text-xs text-gray-400">{email}</p>
                <button
                  onClick={() => { setMobileMenuOpen(false); setShowSettingsModal(true); }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
                >
                  Settings
                </button>
                <button
                  onClick={() => signOut({ redirect: false })}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { open("signin"); setMobileMenuOpen(false); }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { open("signup"); setMobileMenuOpen(false); }}
                  className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#456BFF] to-[#2548D2] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>

    {showSettingsModal && (
      <SettingsModal onClose={() => setShowSettingsModal(false)} email={email} />
    )}
    </>
  );
}
