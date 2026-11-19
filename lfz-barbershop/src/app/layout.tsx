import type { Metadata, Viewport } from "next";
import { Anton, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Anton({ subsets: ["latin"], weight: "400", variable: "--f-display" });
const body = DM_Sans({ subsets: ["latin"], variable: "--f-body" });

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "LFZ BarberShop | Reservá tu turno",
  description: "Elegí tu servicio, tu día y tu horario. Reservá tu turno en LFZ BarberShop en pocos pasos.",
  openGraph: { title: "LFZ BarberShop | Reservá tu turno", description: "Reservá tu turno online en minutos.", type: "website", locale: "es_AR" },
};
export const viewport: Viewport = { themeColor: "#0a0a0b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
