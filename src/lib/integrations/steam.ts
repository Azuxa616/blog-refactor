import { fetchJson } from './http'
import type { SteamData, SteamGame, SteamProfile } from '@/types'

const BASE = 'https://api.steampowered.com/IPlayerService'

interface SteamResponse<T> {
  response?: T
}

interface SteamLevelResponse {
  player_level?: number
}

interface SteamGameRaw {
  appid?: number
  name?: string
  img_icon_url?: string
  playtime_forever?: number
  playtime_2weeks?: number
  rtime_last_played?: number
}

interface RecentGamesResponse {
  games?: SteamGameRaw[]
}

interface OwnedGamesResponse {
  game_count?: number
  games?: SteamGameRaw[]
}

interface SteamPlayerRaw {
  personaname?: string
  avatarfull?: string
  timecreated?: number
  personastate?: number
  loccountrycode?: string
  profileurl?: string
}

interface PlayerSummariesResponse {
  players?: SteamPlayerRaw[]
}

function iconUrl(appid: number, hash: string): string {
  return hash ? 'https://media.steampowered.com/steamcommunity/public/images/apps/' + appid + '/' + hash + '.jpg' : ''
}

function toGame(g: SteamGameRaw, lastPlayedAt: number | null): SteamGame {
  return {
    appid: g.appid ?? 0,
    name: g.name ?? '',
    imgIconUrl: iconUrl(g.appid ?? 0, g.img_icon_url ?? ''),
    playtimeForeverMinutes: g.playtime_forever ?? 0,
    playtime2weeksMinutes: g.playtime_2weeks ?? 0,
    lastPlayedAt,
  }
}

export async function getSteamData(): Promise<SteamData | null> {
  const key = import.meta.env.STEAM_API_KEY
  const steamid = import.meta.env.STEAM_ID
  if (!key || !steamid) return null

  const [levelRes, recentRes, ownedRes, playersRes] = await Promise.all([
    fetchJson<SteamResponse<SteamLevelResponse>>(BASE + '/GetSteamLevel/v1/?key=' + key + '&steamid=' + steamid),
    fetchJson<SteamResponse<RecentGamesResponse>>(BASE + '/GetRecentlyPlayedGames/v1/?key=' + key + '&steamid=' + steamid + '&count=10'),
    fetchJson<SteamResponse<OwnedGamesResponse>>(BASE + '/GetOwnedGames/v1/?key=' + key + '&steamid=' + steamid + '&include_appinfo=true&include_played_free_games=true'),
    fetchJson<SteamResponse<PlayerSummariesResponse>>('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=' + key + '&steamids=' + steamid),
  ])

  const level = levelRes?.response?.player_level ?? null
  const totalGames = ownedRes?.response?.game_count ?? null
  const ownedGames = ownedRes?.response?.games ?? []

  const lastPlayedMap = new Map<number, number>()
  for (const g of ownedGames) {
    if (g.appid != null && g.rtime_last_played) lastPlayedMap.set(g.appid, g.rtime_last_played)
  }

  const recentlyPlayed = (recentRes?.response?.games ?? [])
    .map((g) => toGame(g, lastPlayedMap.get(g.appid ?? 0) ?? null))
    .slice(0, 6)

  const topGames = ownedGames
    .filter((g) => (g.playtime_forever ?? 0) > 0)
    .sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
    .slice(0, 8)
    .map((g) => toGame(g, g.rtime_last_played ?? null))

  const totalMinutes = ownedGames.reduce((sum, g) => sum + (g.playtime_forever ?? 0), 0)

  const player = playersRes?.response?.players?.[0]
  const profile: SteamProfile | null = player
    ? {
        name: player.personaname ?? '',
        avatarUrl: player.avatarfull ?? '',
        sinceYear: player.timecreated ? new Date(player.timecreated * 1000).getFullYear() : null,
        online: (player.personastate ?? 0) > 0,
        country: player.loccountrycode ?? null,
      }
    : null

  if (level === null && totalGames === null && recentlyPlayed.length === 0 && topGames.length === 0) {
    return null
  }

  return {
    level,
    profileUrl: player?.profileurl ?? 'https://steamcommunity.com/profiles/' + steamid,
    totalGames,
    totalMinutes,
    recentlyPlayed,
    topGames,
    profile,
  }
}