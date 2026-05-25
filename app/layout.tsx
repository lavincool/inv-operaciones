import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import HeaderNavbar from "./(components)/HeaderNavbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "Inv. Operaciones";
const APP_DEFAULT_TITLE = "Inv. Operaciones";
const APP_TITLE_TEMPLATE = "%s";
const APP_DESCRIPTION =
  "Sistema de apoyo para la resolucion de problemas de Investigacion de Operaciones: modelos de inventarios y lineas de espera.";

export const metadata: Metadata = {
  icons: {
    shortcut: "/icons/128x128.png",
    apple: "/icons/128x128.png",
  },
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
  themeColor: "#18181b",
  viewportFit: "cover",
  initialScale: 1,
  width: "device-width",
  height: "device-height",
  minimumScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col">
        <HeaderNavbar />
        {children}
      </body>
    </html>
  );
}
