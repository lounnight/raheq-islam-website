'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { navItems } from '@/types'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { quranAudio } from '@/hooks/use-quran-audio'
import { BookOpen, Clock3, Heart, Home, ListChecks, Moon, ScrollText, Search, Sun } from 'lucide-react'


const icons = {
  home: () => <Home className="size-4" />,
  'book-open': () => <BookOpen className="size-4" />,
  'scroll-text': () => <ScrollText className="size-4" />,
  heart: () => <Heart className="size-4" />,
  clock: () => <Clock3 className="size-4" />,
  'list-checks': () => <ListChecks className="size-4" />,
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'

  useEffect(() => {
    if (!pathname.startsWith('/quran') && quranAudio.getState().currentAyah) {
      quranAudio.stop()
    }
  }, [pathname])

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 backdrop-blur md:px-8">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <img src="/logo2.png" alt="رحيق الإسلام" className="size-9 rounded-xl object-cover" />
            <span><strong className="block text-base">رحيق الإسلام</strong><small className="hidden text-xs text-muted-foreground sm:block">نورٌ في كل يوم</small></span>
          </Link>
          <nav aria-label="التنقل الرئيسي" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {navItems.map((item) => { const Icon = icons[item.icon]; const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)); return <Link key={item.href} href={item.href} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon data-icon="inline-start" />{item.label.replace('أوقات الصلاة', 'الصلاة').replace('القرآن الكريم', 'القرآن')}</Link> })}
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="تبديل المظهر">{dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pt-6 pb-12 md:px-8 md:pt-10">{children}</main>
    </div>
  )
}
