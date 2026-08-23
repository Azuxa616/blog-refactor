import { githubData } from '@/data/github'
import type { DimensionsData } from '@/types'
import { getWakaTimeStats } from './wakatime'
import { getGitHubData } from './github'
import { getSteamData } from './steam'
import { getBangumiGames } from './bangumi'

export const DIMENSIONS_TTL_MS = 30 * 60 * 1000

let cache: DimensionsData | null = null
let fetchedAt = 0
let inflight: Promise<DimensionsData> | null = null

async function fetchAll(): Promise<DimensionsData> {
  const [wakatime, github, steam, bangumi] = await Promise.all([
    getWakaTimeStats(),
    getGitHubData(),
    getSteamData(),
    getBangumiGames(),
  ])
  return {
    tech: { skills: githubData.skills, wakatime, github },
    gaming: steam,
    else: bangumi,
  }
}

export async function getDimensionsData(): Promise<DimensionsData> {
  const now = Date.now()
  if (cache && now - fetchedAt < DIMENSIONS_TTL_MS) return cache
  if (!inflight) {
    inflight = fetchAll()
      .then((data) => {
        cache = data
        fetchedAt = Date.now()
        return data
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function clearDimensionsCache(): void {
  cache = null
  fetchedAt = 0
}