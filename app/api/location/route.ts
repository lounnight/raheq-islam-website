import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  let ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || ''

  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    ip = ''
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 }
    })

    if (!res.ok) {
      throw new Error('IP geolocation request failed')
    }

    const data = await res.json()

    if (data.error) {
      throw new Error(data.reason || 'IP lookup failed')
    }

    return NextResponse.json({
      city: data.city || 'مكه',
      country: data.country_name || 'المملكة العربية السعودية',
      latitude: typeof data.latitude === 'number' ? data.latitude : 24.7136,
      longitude: typeof data.longitude === 'number' ? data.longitude : 46.6753,
      utcOffset: typeof data.utc_offset === 'string' ? parseInt(data.utc_offset, 10) || 3 : 3
    })
  } catch (error) {
    return NextResponse.json({
      city: 'مكه',
      country: 'المملكة العربية السعودية',
      latitude: 24.7136,
      longitude: 46.6753,
      utcOffset: 3,
      isFallback: true
    })
  }
}
