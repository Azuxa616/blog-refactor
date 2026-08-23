import { fetchJson } from './http'
import type { WakaTimeStats } from '@/types'

const API = 'https://api.wakatime.com/api/v1'

interface WakaTimeRaw {
  data?: {
    total_seconds?: number
    human_readable_total?: string
    daily_average?: number
    human_readable_daily_average?: string
    best_day?: { date?: string; total_seconds?: number; text?: string } | null
    languages?: { name?: string; percent?: number; total_seconds?: number; text?: string }[]
  }
}

export async function getWakaTimeStats(): Promise<WakaTimeStats | null> {
  const key = import.meta.env.WAKATIME_API_KEY
  if (!key) return null
  const auth = 'Basic ' + Buffer.from(key + ':').toString('base64')
  const raw = await fetchJson<WakaTimeRaw>(API + '/users/current/stats?range=last_30_days', {
    headers: { Authorization: auth },
  })
  const d = raw?.data
  if (!d) return null
  return {
    totalSeconds: d.total_seconds ?? 0,
    humanReadableTotal: d.human_readable_total ?? '',
    dailyAverageSeconds: d.daily_average ?? 0,
    humanReadableDailyAverage: d.human_readable_daily_average ?? '',
    bestDay: d.best_day
      ? { date: d.best_day.date ?? '', totalSeconds: d.best_day.total_seconds ?? 0, text: d.best_day.text ?? '' }
      : null,
    languages: (d.languages ?? []).slice(0, 6).map((l) => ({
      name: l.name ?? '',
      percent: l.percent ?? 0,
      totalSeconds: l.total_seconds ?? 0,
      text: l.text ?? '',
    })),
  }
}