import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/config/site";
import { getSiteContent } from "@/lib/content";
import { introScript, introStyle } from "@/lib/intro";
import "./globals.css";

const montserrat = localFont({
  src: "./fonts/montserrat-latin-wght-normal.woff2",
  variable: "--font-montserrat",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    locale: "en_IN",
  },
  robots: { index: false, follow: false }, // switch on at launch (Step 8)
};

export const viewport: Viewport = {
  themeColor: "#0d2236",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Logo intro length and replay rule come from Content → Website settings → Logo intro.
  const { intro } = await getSiteContent();
  return (
    <html lang="en" className={montserrat.variable} style={introStyle(intro)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript(intro) }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
