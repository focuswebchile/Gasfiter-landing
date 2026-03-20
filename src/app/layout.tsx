import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gasfiter-landing-lilac.vercel.app"),
  title: "Gasfiter urgente en Santiago | Reparaciones, destapes e instalaciones",
  description:
    "Gasfitería profesional 24/7 en Santiago. Atendemos fugas, destapes, calefont e instalaciones con respuesta rápida y diagnóstico claro.",
  keywords: [
    "gasfiter",
    "gasfiteria",
    "gasfiter urgente santiago",
    "reparacion de fugas",
    "destape de cañerias",
    "instalacion de griferia",
    "reparacion calefont",
  ],
  authors: [{ name: "Gasfiter Staging" }],
  openGraph: {
    title: "Gasfiter urgente en Santiago | Reparaciones, destapes e instalaciones",
    description:
      "Atención técnica 24/7 para fugas, destapes, calefont e instalaciones en Santiago.",
    type: "website",
    images: ["/images/gasfiter-hero.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gasfiter urgente en Santiago | Reparaciones, destapes e instalaciones",
    description:
      "Atención técnica 24/7 para fugas, destapes, calefont e instalaciones en Santiago.",
    images: ["/images/gasfiter-hero.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
