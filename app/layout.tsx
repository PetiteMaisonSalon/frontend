import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";
import HeaderSpacer from "@/components/HeaderSpacer";

const gildaDisplay = localFont({
  src: "../public/GildaDisplay-Regular.ttf",
  variable: "--font-gilda-display",
  display: "swap",
  weight: "400",
  style: "normal",
});

const publicSans = localFont({
  src: "../public/PublicSans-VariableFont_wght.ttf",
  variable: "--font-public-sans",
  weight: "200",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Petite Maison | Friseursalon Hamburg",
  description:
    "Verbindlich, herzlich, professionell – Deine Haare sind Vertrauenssache. Individuelle Beratung in ruhiger Atmosphäre auf der Uhlenhorst.",
  icons: {
    icon: "/social_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${publicSans.variable} ${gildaDisplay.variable} font-sans antialiased`}
      >
        <Providers>
          <Header />
          <HeaderSpacer />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
