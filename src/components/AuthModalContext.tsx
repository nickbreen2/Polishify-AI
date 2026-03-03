"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AuthTab = "signin" | "signup";

interface AuthModalContextValue {
  open: (tab?: AuthTab) => void;
  close: () => void;
  isOpen: boolean;
  initialTab: AuthTab;
}

const AuthModalContext = createContext<AuthModalContextValue>({
  open: () => {},
  close: () => {},
  isOpen: false,
  initialTab: "signin",
});

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<AuthTab>("signin");

  return (
    <AuthModalContext.Provider
      value={{
        open: (tab: AuthTab = "signin") => {
          setInitialTab(tab);
          setIsOpen(true);
        },
        close: () => setIsOpen(false),
        isOpen,
        initialTab,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
