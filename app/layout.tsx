import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fotomodel Pro - Modelos Virtuais. Resultados Reais',
  description: 'Crie modelos virtuais realistas com IA para suas roupas e produtos',
  keywords: ['fotomodel', 'modelo virtual', 'IA', 'fashion', 'e-commerce'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
