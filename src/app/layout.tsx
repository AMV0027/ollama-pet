import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Ollama Pet — Your Desktop AI Companion Powered by Local LLMs',
    template: '%s | Ollama Pet'
  },
  description: 'A customizable, interactive desktop AI pet widget powered by local LLMs via Ollama. Built with Tauri 2, React, and TypeScript. 100% local, zero telemetry, works offline.',
  keywords: ['AI pet', 'desktop widget', 'Ollama', 'local LLM', 'Tauri', 'React', 'privacy', 'offline AI'],
  authors: [{ name: 'AMV0027' }],
  creator: 'AMV0027',
  publisher: 'Ollama Pet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ollama-pet.dev'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ollama-pet.dev',
    siteName: 'Ollama Pet',
    title: 'Ollama Pet — Your Desktop AI Companion',
    description: 'A customizable, interactive desktop AI pet widget powered by local LLMs via Ollama.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ollama Pet - Desktop AI Companion'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ollama Pet — Your Desktop AI Companion',
    description: 'A customizable, interactive desktop AI pet widget powered by local LLMs via Ollama.',
    images: ['/og-image.png'],
    creator: '@AMV0027',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  category: 'software',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://github.com" />
        <link rel="preload" as="image" href="/sprites/waving.webp" />
        {/* Other sprites will be lazy loaded by SpriteAnimator via loading="lazy" */}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}