import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import { ServiceWorker } from "@/components/shell/service-worker";
import { Toaster } from "@/components/ui/toaster";
import { env } from "@/lib/env";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "JournApp: notice what you can control",
    template: "%s · JournApp",
  },
  description:
    "A daily journal for self-awareness. Check in with your mood, body and energy, write, and move towards your goals one small step at a time.",
  applicationName: "JournApp",
  appleWebApp: { capable: true, title: "JournApp", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "JournApp",
    title: "JournApp: notice what you can control",
    description: "Check in with your mood, body and energy. Write. Move towards your goals.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#141a19" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${hanken.variable} ${newsreader.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <Toaster />
        <ServiceWorker />
      </body>
    </html>
  );
}
