import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./studio.css";

const sans = localFont({
  src: "./fonts/SpaceGrotesk-Variable.ttf",
  variable: "--font-maia-sans",
  weight: "300 700",
  display: "swap",
});
const editorial = localFont({
  src: "./fonts/InstrumentSerif-Italic.ttf",
  variable: "--font-maia-editorial",
  weight: "400",
  style: "italic",
  display: "swap",
});
const display = localFont({
  src: "./fonts/BarlowCondensed-Bold.ttf",
  variable: "--font-maia-display",
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MaiaShoes | Seu estilo, seu caminho",
  description:
    "Conheça o universo Maia Shoes & Bags. Calçados e bolsas para acompanhar o seu dia a dia.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${editorial.variable} ${display.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
