import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import MigrationHandler from "@/components/MigrationHandler";
import AuthProvider from "@/components/AuthProvider";
import DataRefreshProvider from "@/components/DataRefreshProvider";
import CacheManager from "@/components/CacheManager";
import ToastNotification from "@/components/ToastNotification";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tipple - Discover & Create Amazing Cocktails",
  description: "Your ultimate cocktail companion. Discover recipes, find what you can make with your ingredients, and explore the world of mixology.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tipple",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Tipple",
    title: "Tipple - Discover & Create Amazing Cocktails",
    description: "Your ultimate cocktail companion. Discover recipes, find what you can make with your ingredients, and explore the world of mixology.",
  },
  twitter: {
    card: "summary",
    title: "Tipple - Discover & Create Amazing Cocktails",
    description: "Your ultimate cocktail companion. Discover recipes, find what you can make with your ingredients, and explore the world of mixology.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Tipple" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tipple" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <DataRefreshProvider>
            <MigrationHandler />
            <Navigation />
            <main className="min-h-screen">
              {children}
            </main>
            <CacheManager />
            <ToastNotification />
          </DataRefreshProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
