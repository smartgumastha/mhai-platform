import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./components/print/print.css";
import { Providers } from "./providers";
import { Toast } from "@/components/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MHAI — 11 AI teammates in one magical assistant for your clinic",
  description:
    "Clara writes your website, books patients, calls leads, posts social media. Officially integrates with WhatsApp, Meta, Google, YouTube. Powered by Claude AI. 70+ languages, 8 countries. Free trial.",
  openGraph: {
    title: "Meet Clara — your clinic's 11 AI teammates",
    description: "Launch in 5 minutes. Free for 14 days.",
    images: ["/clara-demo-poster.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MHAI" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "MHAI - MediHost AI",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "2999", priceCurrency: "INR" },
          description: "AI marketing platform for healthcare clinics with 11 integrated tools.",
          creator: { "@type": "Organization", name: "MediHost AI Technologies Pvt Ltd", url: "https://medihost.in" }
        })}} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toast />
        </Providers>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
