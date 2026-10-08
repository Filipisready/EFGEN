import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "EFGEN",
  description: "Generátor skupinových tréninků pro trenéry: Tabata, TRX a CrossFit.",
};

export const viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f6f1" }, { media: "(prefers-color-scheme: dark)", color: "#0c0d0b" }] };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="cs"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col"><SiteHeader /><div className="flex-1">{children}</div><Footer /></body>
    </html>
  );
}
