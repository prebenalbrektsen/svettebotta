import type { Metadata, Viewport } from "next";
import { Anton, Barlow } from "next/font/google";
import "./globals.css";

const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display-family" });
const body = Barlow({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-body-family" });

export const metadata: Metadata = {
  title: "Svettebøtta",
  description: "Familiens treningsutfordring – økter, bøter og statistikk.",
  appleWebApp: { capable: true, title: "Svettebøtta", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#12110e" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
