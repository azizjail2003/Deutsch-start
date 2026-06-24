import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Deutsch Start — Learn German A1–B1, free",
  description:
    "A free, open home base for learning German from A1 to B1: a 142-lesson roadmap across three levels, vocabulary practice with spaced repetition, and the best free resources for grammar, vocabulary, listening, speaking and writing.",
  applicationName: "Deutsch Start",
  authors: [{ name: "Abdelaziz Jail", url: "mailto:jailabdelaziz@icloud.com" }],
  creator: "Abdelaziz Jail",
  keywords: [
    "learn German", "German A1", "German A2", "German B1", "German vocabulary",
    "German flashcards", "spaced repetition", "free German course", "Deutsch lernen",
  ],
  openGraph: {
    title: "Deutsch Start — Learn German A1–B1, free",
    description:
      "A free, open home base for learning German A1–B1: a 142-lesson roadmap, vocabulary practice with spaced repetition, and curated free resources.",
    siteName: "Deutsch Start",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deutsch Start — Learn German A1–B1, free",
    description: "A free, open home base for learning German A1–B1: a 142-lesson roadmap, spaced-repetition practice, and curated free resources.",
  },
  // Send no Referer on subresource requests so the online TTS audio source
  // (which 404s when a Referer is present) returns audio in the browser.
  referrer: "no-referrer",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
