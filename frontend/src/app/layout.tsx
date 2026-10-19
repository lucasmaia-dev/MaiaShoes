import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MaiaShoes | Seu estilo, seu caminho",
  description: "Conheça o universo Maia Shoes & Bags. Calçados e bolsas para acompanhar o seu dia a dia.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
