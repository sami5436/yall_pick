import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TAGLINE, siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Y'all Pick",
    template: "%s | Y'all Pick",
  },
  description: TAGLINE,
  applicationName: "Y'all Pick",
  appleWebApp: { capable: true, title: "Y'all Pick", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: "Y'all Pick",
    title: "Y'all Pick",
    description: TAGLINE,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Y'all Pick",
    description: TAGLINE,
  },
};

export const viewport = {
  themeColor: "#f1f2f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
