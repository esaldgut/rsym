import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// CRÍTICO: Import obligatorio para OAuth en Next.js según docs oficiales Amplify v6
import 'aws-amplify/auth/enable-oauth-listener';
import { ConfigureAmplifyClientSide } from './amplify-client-config';
import { QueryProvider } from '../components/providers/QueryProvider';
import { Navbar } from '@/components';
import { OAuthHandler } from '../components/auth/OAuthHandler';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YAAN",
  description: "YAAN Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}>
        <ConfigureAmplifyClientSide />
        <OAuthHandler />
        <QueryProvider>
          <Navbar />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
