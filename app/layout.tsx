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

export const metadata: Metadata = {
  title: "Deutsch Start — Learn German A1–B1, free",
  description:
    "A free home base for learning German from A1 to B1: a 142-lesson roadmap across three levels, vocabulary practice, and the best free resources for grammar, vocabulary, listening, speaking and writing.",
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
