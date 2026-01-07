import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gasfiter | Gasfitería Profesional 24/7",
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
    title: "Gasfiter | Gasfitería Profesional 24/7",
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
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
