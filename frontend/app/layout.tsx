import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: "Simondu Web - Sistem Monitoring Dumas",
  description: "Sistem Monitoring Dumas - Subbid Paminal Bidpropam Polda Jabar",
  icons: {
    icon: '/logo.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
