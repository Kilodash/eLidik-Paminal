import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { FontProvider } from '@/components/font-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'e-Lidik Paminal',
  description: 'Aplikasi Administrasi Pengaduan Masyarakat & Monitoring Tindak Lanjut',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`font-sans h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <FontProvider>
            {children}
            <Toaster richColors position="top-right" />
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
