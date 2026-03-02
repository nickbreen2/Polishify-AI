"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AuthModalContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const AuthModalContext = createContext<AuthModalContextValue>({
  open: () => {},
  close: () => {},
  isOpen: false,
});

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AuthModalContext.Provider
      value={{ open: () => setIsOpen(true), close: () => setIsOpen(false), isOpen }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
