import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SessionProvider from "@/components/providers/SessionProvider";
import { FontProvider } from "@/context/FontContext";
import { TracingSettingsProvider } from "@/context/TracingSettingsContext";
import { Toaster } from "@/components/ui/sonner";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;600&family=Dancing+Script:wght@400;700&family=Raleway:wght@400;700&family=Righteous&family=Creepster&family=Nosifer&family=Rubik+Wet+Paint&family=Fredericka+the+Great&family=Poppins:wght@400;600;700&family=Pacifico&family=Black+Ops+One&family=Satisfy&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${sora.variable} font-sans antialiased`}
      >
        <SessionProvider>
          <FontProvider>
            <TracingSettingsProvider>
              <Header />
              <main className="min-h-screen pt-16 pb-8">
                {children}
              </main>
              <Footer />
            </TracingSettingsProvider>
          </FontProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
