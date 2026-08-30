'use client'

import { useState, useEffect, useMemo } from 'react'
import { MapPin, Settings2 } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import {
  CALCULATION_METHODS,
  METHOD_LABELS,
  SUPPORTED_MADHABS,
  MADHAB_LABELS,
  CalculationMethodKey
} from '@/services/prayer-times'
import {
  getStoredPrayerSettings,
  savePrayerSettings,
  calculatePrayerData,
  DEFAULT_PRAYER_SETTINGS
} from '@/lib/prayer-storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export default function PrayerPage() {
  const [settings, setSettings] = useState(DEFAULT_PRAYER_SETTINGS)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [now, setNow] = useState<Date | null>(null)
  const [isLocating, setIsLocating] = useState<boolean>(false)

  useEffect(() => {
    const loaded = getStoredPrayerSettings()
    setSettings(loaded)
  }, [])

  const updateSetting = <K extends keyof typeof DEFAULT_PRAYER_SETTINGS>(
    key: K,
    value: (typeof DEFAULT_PRAYER_SETTINGS)[K]
  ) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    savePrayerSettings(updated)
  }

  const detectLocationAutomatically = async () => {
    setIsLocating(true)

    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true
          })
        })

        const lat = Number(position.coords.latitude.toFixed(4))
        const lng = Number(position.coords.longitude.toFixed(4))
        const offset = -Math.round(new Date().getTimezoneOffset() / 60)

        const newLoc = {
          latitude: lat,
          longitude: lng,
          utcOffset: offset,
          locationName: 'الموقع الجغرافي الدقيق'
        }
        setSettings((prev) => {
          const u = { ...prev, ...newLoc }
          savePrayerSettings(u)
          return u
        })
        setIsLocating(false)
        return
      } catch (err) {
        console.warn('Geolocation API failed or permission denied, falling back to IP location', err)
      }
    }

    try {
      const res = await fetch('/api/location')
      if (res.ok) {
        const data = await res.json()
        const newLoc = {
          latitude: data.latitude,
          longitude: data.longitude,
          utcOffset: data.utcOffset,
          locationName: `${data.city}، ${data.country}`
        }
        setSettings((prev) => {
          const u = { ...prev, ...newLoc }
          savePrayerSettings(u)
          return u
        })
      }
    } catch (e) {
      console.error('IP Geolocation error', e)
    } finally {
      setIsLocating(false)
    }
  }

  useEffect(() => {
    const stored = getStoredPrayerSettings()
    if (stored.locationName === DEFAULT_PRAYER_SETTINGS.locationName) {
      detectLocationAutomatically()
    }
  }, [])

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const prayerData = useMemo(() => {
    return calculatePrayerData(settings, now || new Date())
  }, [now, settings])

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-muted-foreground">الثلاثاء، ١٢ ربيع الأول ١٤٤٦ هـ</p>
            <h1 className="mt-2 text-3xl font-bold">أوقات الصلاة</h1>
            <p className="mt-2 flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" />
              <span>{settings.locationName}</span>
              {isLocating && (
                <Badge variant="secondary" className="animate-pulse text-xs">
                  جاري التحديد التلقائي...
                </Badge>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={detectLocationAutomatically}
              disabled={isLocating}
              className="gap-2 text-xs"
            >
              <MapPin className="size-4" />
              <span>تحديد موقعي أوتوماتيكيًا</span>
            </Button>

            <Button
              variant={showSettings ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2 text-xs"
            >
              <Settings2 className="size-4" />
              <span>الإعدادات</span>
            </Button>
          </div>
        </div>

        
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إعدادات المواقيت والموقع الجغرافي</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="latitude" className="text-xs text-muted-foreground">
                  خط العرض (Latitude)
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={settings.latitude}
                  onChange={(e) => updateSetting('latitude', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="longitude" className="text-xs text-muted-foreground">
                  خط الطول (Longitude)
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={settings.longitude}
                  onChange={(e) => updateSetting('longitude', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="utcOffset" className="text-xs text-muted-foreground">
                  الفارق الزمني (UTC Offset)
                </Label>
                <Input
                  id="utcOffset"
                  type="number"
                  step="1"
                  value={settings.utcOffset}
                  onChange={(e) => updateSetting('utcOffset', parseInt(e.target.value, 10) || 0)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">طريقة الحساب</Label>
                <Select
                  value={settings.method}
                  onValueChange={(value) => updateSetting('method', value as CalculationMethodKey)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METHOD_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">المذهب لصلاة العصر</Label>
                <Select
                  value={settings.madhab}
                  onValueChange={(value) => updateSetting('madhab', String(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_MADHABS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MADHAB_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">نظام عرض الوقت</Label>
                <Select
                  value={settings.hours12 ? '12' : '24'}
                  onValueChange={(value) => updateSetting('hours12', value === '12')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 ساعة (ص/م)</SelectItem>
                    <SelectItem value="24">24 ساعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">الصلاة القادمة</p>
              <h2 className="mt-1 text-2xl font-bold">صلاة {prayerData.nextName}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">الوقت المتبقي للأذان</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-wider">
                {prayerData.countdownStr}
              </p>
            </div>
          </CardContent>
        </Card>

        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {prayerData.prayers.map((p) => (
            <Card key={p.name} className={p.isNext ? 'ring-2 ring-primary' : undefined}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{p.name}</span>
                  {p.isNext && <Badge variant="default">الصلاة القادمة</Badge>}
                </div>
                <Separator className="my-4" />
                <p className="font-mono text-3xl font-semibold">{p.time}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}