import type { Metadata } from 'next'
import './globals.css'
import '@/components/toast.css'
import { ToastProvider } from '@/components/ToastProvider'

export const metadata: Metadata = {
  title: 'Ohm - Hardware Lifecycle Orchestrator',
  description: 'The path of least resistance. An intelligent workspace that bridges the gap between software and silicon.',
  icons: {
    icon: '/omega1.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=JetBrains+Mono:wght@100..800&display=swap"
          rel="stylesheet"
        />
        {/* TweakCN Live Preview - for theme testing */}
        <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
        {/* Enable View Transitions API */}
        <meta name="view-transition" content="same-origin" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
