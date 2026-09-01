import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Amiri_Quran, Cairo } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const arabicFont = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-arabic' })

const amiriFont = Amiri_Quran({
  subsets: ['arabic', 'latin'],
  weight: ['400'],
  variable: '--font-amiri',
})

const siteUrl = 'https://raheq-islam-website.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'رحيق الإسلام | نورٌ في كل يوم',
  description: 'منصة إسلامية لقراءة القرآن والأحاديث والأذكار ومعرفة أوقات الصلاة.',
  generator: 'رحيق الإسلام',
  icons: {
    icon: [
      {
        url: '/logo2.png',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'ar',
    siteName: 'رحيق الإسلام',
    title: 'رحيق الإسلام | نورٌ في كل يوم',
    description:
      'منصة إسلامية شاملة: المصحف المديني بالتلاوة والتفسير، مواقيت الصلاة، الأحاديث النبوية، الأذكار، وأسئلة وأجوبة إسلامية.',
    url: siteUrl,
    images: [
      {
        url: '/raheq-banner.png',
        width: 1920,
        height: 1080,
        alt: 'رحيق الإسلام — نورٌ في كل يوم',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'رحيق الإسلام | نورٌ في كل يوم',
    description:
      'منصة إسلامية شاملة: المصحف المديني بالتلاوة والتفسير، مواقيت الصلاة، الأحاديث النبوية، الأذكار، وأسئلة وأجوبة إسلامية.',
    images: ['/raheq-banner.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className="bg-background" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',!d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${arabicFont.variable} ${amiriFont.variable} antialiased font-sans`}>
        <ThemeProvider>{children}</ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
