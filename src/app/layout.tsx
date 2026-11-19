import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Intro } from "@/components/brand/Intro";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Ticker } from "@/components/layout/Ticker";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { site } from "@/config/site";
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

/** Marks repeat visits in this browser session before first paint, so the intro never flashes. */
const introScript = `try{if(sessionStorage.getItem("es-intro"))document.documentElement.dataset.intro="skip"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={montserrat.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-deep"
        >
          Skip to content
        </a>
        <Intro />
        <Ticker />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
