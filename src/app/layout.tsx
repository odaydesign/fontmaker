import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { FontProvider } from "@/context/FontContext";
import { SupabaseAuthProvider } from "@/context/SupabaseAuthContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HappyFont - AI Typography Creation",
  description: "Create custom typography fonts using AI-generated graphics or uploaded images.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SupabaseAuthProvider>
            <FontProvider>
              <Header />
              <main className="min-h-screen pt-16 pb-8">
                {children}
              </main>
              <Footer />
            </FontProvider>
          </SupabaseAuthProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
