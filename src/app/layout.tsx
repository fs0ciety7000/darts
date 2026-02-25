import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'Darts OCC',
  description: 'Scoreboard professionnel pour parties de fléchettes — X01, Cricket, Shanghai',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
