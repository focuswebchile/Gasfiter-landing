import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABcis-Gobierno y Compliance",
  description:
    "Gasfitería profesional 24/7. Instalaciones, reparaciones y mantenciones rápidas en tu zona. Llama ahora o solicita una cotización gratis.",
  keywords: [
    "gasfiter",
    "gasfiteria",
    "gasfiter 24/7",
    "reparacion de fugas",
    "destape de cañerias",
    "instalacion de griferia",
  ],
  authors: [{ name: "Gasfiter" }],
  openGraph: {
    title: "ABcis-Gobierno y Compliance",
    description:
      "Servicio rápido y confiable de gasfitería en tu zona. Técnicos certificados y 5 estrellas en Google Reviews.",
    type: "website",
    images: ["https://placehold.co/1200x630/png"],
  },
  twitter: {
    card: "summary_large_image",
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
