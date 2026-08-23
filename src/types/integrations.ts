// 外部数据集成类型定义

export interface Skill {
  name: string
  proficiency: number
  imgUrl?: string
  docUrl?: string
}

export interface WakaTimeLanguage {
  name: string
  percent: number
  totalSeconds: number
  text: string
}

export interface WakaTimeStats {
  totalSeconds: number
  humanReadableTotal: string
  dailyAverageSeconds: number
  humanReadableDailyAverage: string
  bestDay: { date: string; totalSeconds: number; text: string } | null
  languages: WakaTimeLanguage[]
}

export interface GitHubProfile {
  login: string
  name: string
  bio: string
  avatarUrl: string
  followers: number
  following: number
  publicRepos: number
  htmlUrl: string
}

export interface GitHubRepoSummary {
  id: number
  name: string
  description: string | null
  htmlUrl: string
  updatedAt: string
  language: string | null
  stars: number
  forks: number
}

export interface GitHubData {
  profile: GitHubProfile | null
  repos: GitHubRepoSummary[]
}

export interface SteamGame {
  appid: number
  name: string
  imgIconUrl: string
  playtimeForeverMinutes: number
  playtime2weeksMinutes: number
  lastPlayedAt: number | null
}

export interface SteamProfile {
  name: string
  avatarUrl: string
  sinceYear: number | null
  online: boolean
  country: string | null
}

export interface SteamData {
  level: number | null
  profileUrl: string
  totalGames: number | null
  totalMinutes: number
  recentlyPlayed: SteamGame[]
  topGames: SteamGame[]
  profile: SteamProfile | null
}

export type BangumiStatus = 'wish' | 'doing' | 'done' | 'onHold' | 'dropped'

export interface BangumiGame {
  id: number
  name: string
  coverUrl: string
  communityScore: number | null
  userRate: number | null
  status: BangumiStatus
  updatedAt: string
  releaseDate: string
  tags: string[]
}

export interface TechDimensionData {
  skills: {
    learned: Skill[]
    practicing: Skill[]
  }
  wakatime: WakaTimeStats | null
  github: GitHubData
}

export interface DimensionsData {
  tech: TechDimensionData
  gaming: SteamData | null
  else: BangumiGame[]
}