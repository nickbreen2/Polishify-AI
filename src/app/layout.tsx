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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} antialiased`}>
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
