import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
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
    colorNeutral: "#e4e4e7",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
    fontSize: "0.9375rem",
  },
  elements: {
    card: "shadow-2xl border border-zinc-200/80 rounded-2xl",
    headerTitle: "text-zinc-900 font-bold",
    headerSubtitle: "text-zinc-500",
    formButtonPrimary:
      "bg-gradient-to-b from-[#456BFF] to-[#2548D2] hover:from-[#3254f9] hover:to-[#2040c0] text-white shadow-md transition-all",
    socialButtonsBlockButton:
      "border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-colors",
    formFieldInput:
      "border border-zinc-200 rounded-lg focus:border-[#3254f9] focus:ring-1 focus:ring-[#3254f9]",
    footerActionLink: "text-[#3254f9] hover:text-[#2545e0] font-medium",
    identityPreviewEditButton: "text-[#3254f9] hover:text-[#2545e0]",
    formFieldLabel: "text-zinc-700 font-medium",
    dividerLine: "bg-zinc-200",
    dividerText: "text-zinc-400 text-sm",
  },
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en">
        <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} antialiased`}>
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
