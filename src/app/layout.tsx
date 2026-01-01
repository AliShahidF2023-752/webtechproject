import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "SportMatch - Find Your Perfect Sports Partner",
  description: "Skill-based sports matchmaking platform with venue booking, player ratings, and fair play matching. Play Table Tennis & Badminton with players of your skill level.",
  keywords: ["sports", "matchmaking", "table tennis", "badminton", "Pakistan", "booking", "ELO rating"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`}>
        {children}
      </body>
    </html>
  );
}
