'use client'

import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RotateCcw } from 'lucide-react'


export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <p className="text-lg font-medium">تعذر تحميل الأسئلة</p>
            <p className="text-sm text-muted-foreground">
              {error.message || 'حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.'}
            </p>
            <Button onClick={reset} variant="default">
              <RotateCcw className="size-4" data-icon="inline-start" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}