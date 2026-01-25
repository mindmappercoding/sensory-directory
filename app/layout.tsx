import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import Providers from "@/components/Providers";
import { SignIn} from "@/components/SignIn";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEN Directory - Find Sensory-Friendly Venues for Your Family",
  description: "Discover calm, inclusive places designed to support children and families with sensory processing needs. Search by location, read reviews, and share your experiences.",
  keywords: ["sensory-friendly", "SEN", "autism", "ADHD", "sensory processing", "family venues", "inclusive spaces", "quiet hours"],
  openGraph: {
    title: "SEN Directory - Find Sensory-Friendly Venues",
    description: "Discover calm, inclusive places for families with sensory needs",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
        {/* App frame */}
        <div className="min-h-dvh bg-background text-foreground">
          {/* Navbar */}
          <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex h-14 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/15 ring-1 ring-primary/20 grid place-items-center">
                    <span className="text-primary font-semibold">S</span>
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">SEN Directory</div>
                    <div className="text-xs text-muted-foreground -mt-0.5">
                      Sensory-friendly places
                    </div>
                  </div>
                </Link>

                <nav className="flex items-center gap-2">
                  <Link href="/venues">
                    <Button variant="ghost" className="hidden sm:inline-flex">
                      Venues
                    </Button>
                  </Link>
                  <Link href="/submit">
                    <Button className="rounded-xl">Submit a venue</Button>
                  </Link>
                  <SignIn/>
                </nav>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6">{children}</div>
        </div>

        <Toaster richColors position="top-right" />
      </Providers>
      </body>
    </html>
  );
}