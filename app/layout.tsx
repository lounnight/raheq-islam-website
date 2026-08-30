import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Amiri_Quran, Cairo } from 'next/font/google'
import './globals.css'

const arabicFont = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-arabic' })

const amiriFont = Amiri_Quran({
  subsets: ['arabic', 'latin'],
  weight: ['400'],
  variable: '--font-amiri',
})

export const metadata: Metadata = {
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
    <html lang="ar" dir="rtl" className="bg-background">
      <body className={`${arabicFont.variable} ${amiriFont.variable} antialiased font-sans`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
