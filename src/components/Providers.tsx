"use client";

import { SessionProvider } from "next-auth/react";
import { AuthModalProvider, useAuthModal } from "./AuthModalContext";
import { AuthModal } from "./AuthModal";

function AuthModalRenderer() {
  const { isOpen, close, initialTab } = useAuthModal();
  if (!isOpen) return null;
  return <AuthModal onClose={close} initialTab={initialTab} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthModalProvider>
        {children}
        <AuthModalRenderer />
      </AuthModalProvider>
    </SessionProvider>
  );
}
