import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConditionalNavbar } from "@/components/ConditionalNavbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Polishify — Polish your writing with AI",
  description:
    "A Chrome extension that lets you select text on any website, improve it with AI, and replace it in-place.",
  openGraph: {
    title: "Polishify — Polish your writing with AI",
    description:
      "A Chrome extension that lets you select text on any website, improve it with AI, and replace it in-place.",
    url: "https://polishify.app",
    siteName: "Polishify",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Polishify — Polish your writing with AI",
    description:
      "A Chrome extension that lets you select text on any website, improve it with AI, and replace it in-place.",
  },
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#3254f9",
    colorBackground: "#ffffff",
    colorText: "#171717",
    colorTextSecondary: "#71717a",
    colorInputBackground: "#ffffff",
    colorInputText: "#171717",
    colorNeutral: "#71717a",
    borderRadius: "0.75rem",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Geist', 'Segoe UI', sans-serif",
    fontSize: "0.9375rem",
  },
  elements: {
    card: {
      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.2)",
      border: "1px solid rgba(228,228,231,0.8)",
      borderRadius: "1rem",
    },
    formButtonPrimary: {
      background: "linear-gradient(to bottom, #456BFF, #2548D2)",
      color: "#ffffff",
      fontWeight: "600",
      boxShadow: "0 2px 8px rgba(50,84,249,0.35)",
    },
    socialButtonsBlockButton: {
      border: "1.5px solid #d4d4d8",
      color: "#3f3f46",
      fontWeight: "500",
      background: "#ffffff",
    },
    formFieldInput: {
      border: "1.5px solid #d4d4d8",
      borderRadius: "0.5rem",
      color: "#171717",
    },
    footerActionLink: {
      color: "#3254f9",
      fontWeight: "500",
    },
    identityPreviewEditButton: {
      color: "#3254f9",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en">
        <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} antialiased`}>
          <ConditionalNavbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
