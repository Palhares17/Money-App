import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const geistSans = Inter({
  variable: '--font-inter-sans',
  subsets: ['latin'],
});

const geistMono = Inter({
  variable: '--font-inter-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Money App',
  description: 'Aplicativo para controle financeiro pessoal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <section className="mx-12 my-6">{children}</section>
      </body>
    </html>
  );
}
