import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fiorisweets.ro"),
  title: "fíori. — cofetărie artizanală | torturi, prăjituri & dulciuri",
  description:
    "fíori. este un atelier artizanal de dulciuri: torturi personalizate, prăjituri, cookies, marshmallows și candy bar pentru evenimente. Făcute cu drag, în serii mici.",
  openGraph: {
    title: "fíori. — cofetărie artizanală",
    description:
      "Torturi personalizate, prăjituri, cookies și candy bar pentru evenimente. Făcute cu drag, în serii mici.",
    url: "https://fiorisweets.ro",
    siteName: "fíori.",
    locale: "ro_RO",
    type: "website",
    images: [
      {
        url: "/images/hero-box.jpg",
        width: 1600,
        height: 893,
        alt: "Cutie fíori. cu cookies și marshmallows",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#33523f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={poppins.variable}>
      <body className="font-sans bg-cream text-cocoa antialiased">
        {children}
      </body>
    </html>
  );
}
