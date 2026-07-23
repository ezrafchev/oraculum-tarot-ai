import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ezrafchev.github.io"),
  title: {
    default: "ORACULUM AI — Tarô inteligente, privado e auditável",
    template: "%s · ORACULUM AI",
  },
  description:
    "Aplicativo gratuito de Tarô com 78 arcanos, sorteio criptográfico, interpretação local, histórico privado e modo offline.",
  applicationName: "ORACULUM AI",
  authors: [{ name: "Esdra Felipe Silva de Oliveira" }],
  creator: "Esdra Felipe Silva de Oliveira",
  keywords: [
    "tarô",
    "tarot",
    "Rider-Waite-Smith",
    "Marselha",
    "Thoth",
    "sorteio criptográfico",
    "inteligência local",
  ],
  alternates: {
    canonical: "https://ezrafchev.github.io/oraculum-tarot-ai/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icon-192.svg",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://ezrafchev.github.io/oraculum-tarot-ai/",
    title: "ORACULUM AI — Tarô inteligente e auditável",
    description:
      "78 arcanos, sorteio criptográfico e interpretação privada no navegador.",
    siteName: "ORACULUM AI",
  },
  twitter: {
    card: "summary",
    title: "ORACULUM AI",
    description:
      "Tarô completo, gratuito, privado, auditável e disponível offline.",
  },
  other: {
    "codex-preview": "development",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#07070c",
  colorScheme: "dark light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ORACULUM AI",
  url: "https://ezrafchev.github.io/oraculum-tarot-ai/",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any",
  inLanguage: "pt-BR",
  isAccessibleForFree: true,
  author: {
    "@type": "Person",
    name: "Esdra Felipe Silva de Oliveira",
    url: "https://github.com/ezrafchev",
  },
  description:
    "Aplicativo de Tarô com sorteio criptográfico e interpretação local.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
