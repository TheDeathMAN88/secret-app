import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secret Chat - Private Messaging",
  description: "The most secure and private messaging platform for secret conversations. Messages auto-delete after 1 month.",
  keywords: ["secret chat", "private messaging", "secure chat", "discreet messaging"],
  authors: [{ name: "Secret Chat Team" }],
  openGraph: {
    title: "Secret Chat - Private Messaging",
    description: "The most secure and private messaging platform for secret conversations",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Secret Chat - Private Messaging",
    description: "The most secure and private messaging platform for secret conversations",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
