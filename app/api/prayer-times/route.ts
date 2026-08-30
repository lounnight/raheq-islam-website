import { NextRequest, NextResponse } from 'next/server';
import {
    computePrayerTimes,
    formatMinutes,
    SUPPORTED_METHODS,
    SUPPORTED_MADHABS
} from '@/services/prayer-times';

const LATITUDE_RANGE = { min: -90, max: 90 };
const LONGITUDE_RANGE = { min: -180, max: 180 };
const UTC_OFFSET_RANGE = { min: -12, max: 14 };

const toNumber = (value: any) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || value.trim() === '') return Number.NaN;
    return Number(value.trim());
};

const inRange = (value: number, { min, max }: { min: number; max: number }) => value >= min && value <= max;

const toBoolean = (value: any, defaultValue = false) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    if (typeof value === 'boolean') return value;
    const normalized = value.toString().trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
    return defaultValue;
};

const isValidDate = (dateString: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (month < 1 || month > 12) return false;
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return day >= 1 && day <= daysInMonth;
};

export const getLocalDate = (utcOffset: number, nowMs: number) => {
    const localMs = nowMs + utcOffset * 60 * 60 * 1000;
    const d = new Date(localMs);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const parseAndValidate = (query: Record<string, any>) => {
    const latitude = toNumber(query.latitude);
    if (Number.isNaN(latitude) || !inRange(latitude, LATITUDE_RANGE)) {
        return { error: 'Invalid latitude' };
    }

    const longitude = toNumber(query.longitude);
    if (Number.isNaN(longitude) || !inRange(longitude, LONGITUDE_RANGE)) {
        return { error: 'Invalid longitude' };
    }

    const utcOffset = toNumber(query.utcOffset);
    if (Number.isNaN(utcOffset) || !inRange(utcOffset, UTC_OFFSET_RANGE)) {
        return { error: 'Invalid utcOffset' };
    }

    const method = (query.method ?? '').toString().trim().toLowerCase();
    if (!SUPPORTED_METHODS.includes(method)) {
        return { error: 'Invalid method' };
    }

    const madhab = (query.madhab ?? '').toString().trim().toLowerCase();
    if (!SUPPORTED_MADHABS.includes(madhab)) {
        return { error: 'Invalid madhab' };
    }

    let date = (query.date ?? '').toString().trim();
    if (!date) {
        date = getLocalDate(utcOffset, Date.now());
    }
    if (!isValidDate(date)) {
        return { error: 'Invalid date' };
    }

    const hours12 = toBoolean(query.hours_12, false);

    return { latitude, longitude, utcOffset, method, madhab, date, hours12 };
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        queryObj[key] = value;
    });

    const parsed = parseAndValidate(queryObj);
    if ('error' in parsed && parsed.error) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const validParsed = parsed as {
        latitude: number;
        longitude: number;
        utcOffset: number;
        method: string;
        madhab: string;
        date: string;
        hours12: boolean;
    };

    const [year, month, day] = validParsed.date.split('-').map(Number);
    const times = computePrayerTimes({
        year,
        month,
        day,
        latitude: validParsed.latitude,
        longitude: validParsed.longitude,
        utcOffset: validParsed.utcOffset,
        method: validParsed.method,
        madhab: validParsed.madhab
    });

    return NextResponse.json({
        date: validParsed.date,
        location: {
            latitude: validParsed.latitude,
            longitude: validParsed.longitude,
            utcOffset: validParsed.utcOffset
        },
        calculation: {
            method: validParsed.method,
            madhab: validParsed.madhab
        },
        times: {
            fajr: formatMinutes(times.fajr, validParsed.hours12),
            sunrise: formatMinutes(times.sunrise, validParsed.hours12),
            dhuhr: formatMinutes(times.dhuhr, validParsed.hours12),
            asr: formatMinutes(times.asr, validParsed.hours12),
            maghrib: formatMinutes(times.maghrib, validParsed.hours12),
            isha: formatMinutes(times.isha, validParsed.hours12)
        }
    });
}
