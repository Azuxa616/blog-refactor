import { fetchJson } from './http'
import type { BangumiGame, BangumiStatus } from '@/types'

const BASE = 'https://api.bgm.tv/v0'
const GALGAME_TAGS = ['视觉小说', 'Galgame', 'galgame', '文字冒险', 'ADV', '恋爱冒险', 'AVG']

const STATUS_MAP: Record<number, BangumiStatus> = {
  1: 'wish',
  2: 'doing',
  3: 'done',
  4: 'onHold',
  5: 'dropped',
}

interface BangumiRaw {
  data?: CollectionItemRaw[]
}

interface CollectionItemRaw {
  subject?: SubjectRaw
  rate?: number
  type?: number
  updated_at?: string
}

interface SubjectRaw {
  id?: number
  name?: string
  name_cn?: string
  score?: number | null
  date?: string
  images?: { common?: string; small?: string }
  tags?: { name?: string }[]
}

function isGalgame(tags: { name?: string }[] = []): boolean {
  return tags.some((t) => GALGAME_TAGS.some((k) => (t.name ?? '').toLowerCase().includes(k.toLowerCase())))
}

function topTags(tags: { name?: string }[] = [], n = 3): string[] {
  return tags
    .map((t) => t.name ?? '')
    .filter(Boolean)
    .slice(0, n)
}

export async function getBangumiGames(): Promise<BangumiGame[]> {
  const username = import.meta.env.BANGUMI_USERNAME
  if (!username) return []

  const raw = await fetchJson<BangumiRaw>(
    BASE + '/users/' + username + '/collections?subject_type=4&limit=50',
    { headers: { 'User-Agent': 'azuxa-blog/1.0' } },
  )
  const items = raw?.data ?? []

  const mapped = items.flatMap((it) => {
    const s = it.subject
    if (!s || s.id == null) return []
    const game: BangumiGame = {
      id: s.id,
      name: s.name_cn || s.name || '',
      coverUrl: s.images?.common || s.images?.small || '',
      communityScore: s.score ?? null,
      // rate 为 0 表示未评分
      userRate: it.rate && it.rate > 0 ? it.rate : null,
      status: STATUS_MAP[it.type ?? 3] ?? 'done',
      updatedAt: it.updated_at ?? '',
      releaseDate: s.date ?? '',
      tags: topTags(s.tags),
    }
    return [{ game, galgame: isGalgame(s.tags) }]
  })

  let games = mapped.filter((m) => m.galgame).map((m) => m.game)
  if (games.length === 0) {
    games = mapped.map((m) => m.game)
  }

  // 按更新时间倒序，供“近期动态”优先展示
  return games.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
}