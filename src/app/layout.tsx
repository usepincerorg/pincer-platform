import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fonts are served from the repository, so builds never depend on reaching Google Fonts.
const funnel = localFont({
  src: "./fonts/FunnelDisplay-Variable.woff2",
  variable: "--font-funnel",
  weight: "300 800",
  display: "swap",
});

const geist = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

const SITE_URL = "https://usepincer.org";
const TITLE = "Pincer | Private company equity on Robinhood Chain";
const DESCRIPTION =
  "Pincer lets private companies issue their shares as stock tokens on Robinhood Chain, with transfer rules, offerings, Liquidity Windows and corporate actions built in and recorded on-chain.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Pincer",
  },
  description: DESCRIPTION,
  applicationName: "Pincer",
  keywords: [
    "Pincer",
    "Robinhood Chain",
    "private company equity",
    "tokenized shares",
    "stock tokens",
    "issuer-sponsored tokens",
    "cap table",
    "ERC-3643",
    "ERC-8056",
    "transfer rules",
    "Liquidity Windows",
    "private market liquidity",
    "USDG",
  ],
  authors: [{ name: "Pincer", url: SITE_URL }],
  creator: "Pincer",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Pincer",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@usepincer",
    creator: "@usepincer",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${funnel.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-canvas text-navy antialiased">{children}</body>
    </html>
  );
}
