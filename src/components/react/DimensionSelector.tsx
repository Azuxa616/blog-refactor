import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type {
  BangumiGame,
  BangumiStatus,
  GitHubProfile,
  GitHubRepoSummary,
  Skill,
  SteamData,
  SteamGame,
  TechDimensionData,
  WakaTimeLanguage,
} from '@/types'

type DimensionKey = 'tech' | 'gaming' | 'else'

interface DimensionSelectorProps {
  tech: TechDimensionData
  gaming: SteamData | null
  other: BangumiGame[]
}

const COLUMN_W = 64
const COLUMN_H = 320
const PANEL_MIN_W = 560
const PANEL_MAX_W = 940
const STAGE_H = 680

const DIMENSIONS: { key: DimensionKey; label: string }[] = [
  { key: 'tech', label: 'Tech' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'else', label: 'Bangumi' },
]

const STATUS_LABEL: Record<BangumiStatus, string> = {
  wish: '想看',
  doing: '在看',
  done: '玩过',
  onHold: '搁置',
  dropped: '抛弃',
}

function clampPanelWidth(stageW: number): number {
  const bySpace = stageW - COLUMN_W * 6 - 24
  return Math.max(PANEL_MIN_W, Math.min(PANEL_MAX_W, bySpace))
}

function computePositions(activeIndex: number, stageW: number, panelW: number) {
  const panelLeft = stageW / 2 - panelW / 2
  const activeColLeft = panelLeft - COLUMN_W
  const pos: Record<string, number> = {}
  DIMENSIONS.forEach((d, i) => {
    if (i < activeIndex) {
      pos[d.key] = activeColLeft - (activeIndex - i) * COLUMN_W
    } else if (i === activeIndex) {
      pos[d.key] = activeColLeft
    } else {
      pos[d.key] = panelLeft + panelW + (i - activeIndex - 1) * COLUMN_W
    }
  })
  pos.panel = panelLeft
  return pos
}

function formatMinutes(min: number): string {
  if (min <= 0) return '0h'
  if (min < 60) return min + 'm'
  const h = min / 60
  return (h >= 10 ? Math.round(h) : h.toFixed(1)) + 'h'
}

function dateSeconds(dateStr: string): number | null {
  const t = new Date(dateStr || 0).getTime()
  return t ? Math.floor(t / 1000) : null
}

function timeAgo(unixSeconds: number | null): string {
  if (!unixSeconds || unixSeconds <= 0) return ''
  const diff = Date.now() / 1000 - unixSeconds
  const days = Math.floor(diff / 86400)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return days + ' 天前'
  const months = Math.floor(days / 30)
  if (months < 12) return months + ' 个月前'
  return Math.floor(days / 365) + ' 年前'
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="chip px-3 py-2">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-muted">{text}</p>
}

function EmptyState({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted">
      <p className="font-display text-3xl font-bold text-foreground">{label}</p>
      <p className="text-sm">{hint}</p>
    </div>
  )
}

function SafeImage({ src, alt, className, fallback }: { src: string; alt: string; className: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <div className={className}>{fallback}</div>
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />
}

function SkillBar({ skill }: { skill: Skill }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-semibold text-foreground">
          {skill.imgUrl && <img src={skill.imgUrl} alt={skill.name} width={14} height={14} className="object-contain" />}
          {skill.name}
        </span>
        <span className="text-muted">{skill.proficiency}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted-bg">
        <div className="h-2 rounded-full bg-accent" style={{ width: `${skill.proficiency}%` }} />
      </div>
    </div>
  )
}

function LanguageBars({ langs }: { langs: WakaTimeLanguage[] }) {
  return (
    <div className="space-y-3">
      {langs.map((l) => (
        <div key={l.name}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">{l.name}</span>
            <span className="text-muted">{l.percent.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted-bg">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(l.percent, 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProfileStats({ profile }: { profile: GitHubProfile }) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-2">
      <StatChip label="关注者" value={String(profile.followers)} />
      <StatChip label="关注中" value={String(profile.following)} />
      <StatChip label="公开仓库" value={String(profile.publicRepos)} />
    </div>
  )
}

function RepoRow({ repo }: { repo: GitHubRepoSummary }) {
  return (
    <a
      href={repo.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start justify-between gap-3 border-b border-border py-2.5 text-sm transition-colors hover:text-primary"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-semibold">{repo.name}</span>
        {repo.description && <span className="line-clamp-1 text-muted">{repo.description}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-3 text-muted">
        {repo.language && <span>{repo.language}</span>}
        <span>★ {repo.stars}</span>
        <span>⑂ {repo.forks}</span>
      </span>
    </a>
  )
}

function SteamFeaturedCard({ game }: { game: SteamGame }) {
  return (
    <a
      href={`https://store.steampowered.com/app/${game.appid}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-8 flex items-center gap-5 rounded-md border-2 border-ink bg-card-background p-5 shadow-hard"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
        <SafeImage
          src={game.imgIconUrl}
          alt={game.name}
          className="!h-full !w-full object-cover"
          fallback={<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted-bg text-2xl">🎮</div>}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-xl font-bold text-foreground">{game.name}</p>
        <p className="mt-1 text-sm text-muted">
          {game.playtime2weeksMinutes > 0 && `近两周 ${formatMinutes(game.playtime2weeksMinutes)} · `}
          总时长 {formatMinutes(game.playtimeForeverMinutes)}
        </p>
        {game.lastPlayedAt != null && game.lastPlayedAt > 0 && (
          <p className="mt-0.5 text-xs text-muted">上次游玩 {timeAgo(game.lastPlayedAt)}</p>
        )}
      </div>
    </a>
  )
}

function SteamGameRow({ game, rank, caption }: { game: SteamGame; rank: number; caption: string }) {
  return (
    <a
      href={`https://store.steampowered.com/app/${game.appid}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:text-primary"
    >
      <span className="w-7 shrink-0 text-center font-mono text-xs font-bold text-muted">{String(rank).padStart(2, '0')}</span>
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-sm">
        <SafeImage
          src={game.imgIconUrl}
          alt={game.name}
          className="!h-full !w-full object-cover"
          fallback={<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted-bg text-sm">🎮</div>}
        />
      </div>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-foreground">{game.name}</span>
        {game.lastPlayedAt != null && game.lastPlayedAt > 0 && (
          <span className="block text-xs text-muted">上次游玩 {timeAgo(game.lastPlayedAt)}</span>
        )}
      </span>
      <span className="shrink-0 text-muted">{caption}</span>
    </a>
  )
}

function BangumiCard({ game }: { game: BangumiGame }) {
  return (
    <a
      href={`https://bgm.tv/subject/${game.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-md border border-border bg-card-background transition-colors hover:border-ink hover:shadow-hard-hover"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted-bg">
        <SafeImage
          src={game.coverUrl}
          alt={game.name}
          className="!h-full !w-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallback={<div className="flex h-full w-full items-center justify-center bg-muted-bg text-sm text-muted">{game.name.charAt(0) || '音'}</div>}
        />
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{game.name}</p>
        {game.releaseDate && <p className="mt-1 text-xs text-muted">{game.releaseDate.slice(0, 4)}</p>}
        {game.tags.length > 0 && <p className="mt-1 line-clamp-1 text-xs text-muted">{game.tags.join(' · ')}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">
            {game.userRate != null ? `★ ${game.userRate}` : game.communityScore != null ? `社区 ${game.communityScore}` : '未评分'}
          </span>
          <span className="rounded-sm bg-muted-bg px-1.5 py-0.5 text-xs text-muted">{STATUS_LABEL[game.status]}</span>
        </div>
      </div>
    </a>
  )
}

function BangumiFeedRow({ game }: { game: BangumiGame }) {
  return (
    <a
      href={`https://bgm.tv/subject/${game.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:text-primary"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm">
        <SafeImage
          src={game.coverUrl}
          alt={game.name}
          className="!h-full !w-full object-cover"
          fallback={<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted-bg text-sm text-muted">{game.name.charAt(0) || '音'}</div>}
        />
      </div>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-foreground">{game.name}</span>
        {game.releaseDate && <span className="block text-xs text-muted">{game.releaseDate.slice(0, 4)} · {STATUS_LABEL[game.status]}</span>}
      </span>
      <span className="shrink-0 text-xs text-muted">
        {game.userRate != null ? `★ ${game.userRate} · ` : ''}
        {timeAgo(dateSeconds(game.updatedAt))}
      </span>
    </a>
  )
}

function TechContent({ tech }: { tech: TechDimensionData }) {
  const { skills, wakatime, github } = tech
  const langs = wakatime?.languages ?? []

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl font-bold">Tech</h3>
        <p className="eyebrow text-muted">技术栈 · 作品 · 编码统计</p>
      </div>

      {wakatime && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatChip label="近30天编码" value={wakatime.humanReadableTotal || formatMinutes(Math.round(wakatime.totalSeconds / 60))} />
          <StatChip label="日均" value={wakatime.humanReadableDailyAverage || formatMinutes(Math.round(wakatime.dailyAverageSeconds / 60))} />
          <StatChip label="最佳日" value={wakatime.bestDay?.text ?? '—'} />
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <p className="eyebrow mb-4 text-muted">技能雷达</p>
          {skills.learned.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">掌握</p>
              {skills.learned.map((s) => (
                <SkillBar key={s.name} skill={s} />
              ))}
            </div>
          )}
          {skills.practicing.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">学习中</p>
              {skills.practicing.map((s) => (
                <SkillBar key={s.name} skill={s} />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="eyebrow mb-4 text-muted">语言占比</p>
          {langs.length > 0 ? <LanguageBars langs={langs} /> : <EmptyHint text="暂未获取到 WakaTime 数据" />}
        </div>

        <div>
          <p className="eyebrow mb-4 text-muted">GitHub</p>
          {github.profile && <ProfileStats profile={github.profile} />}
          {github.repos.length > 0 ? (
            <div>
              {github.repos.map((r) => (
                <RepoRow key={r.id} repo={r} />
              ))}
            </div>
          ) : (
            <EmptyHint text="暂无仓库" />
          )}
          <a
            href={github.profile?.htmlUrl ?? 'https://github.com/'}
            target="_blank"
            rel="noopener noreferrer"
            className="neo mt-6 inline-flex items-center gap-2 bg-card-background px-4 py-2 text-sm font-semibold text-foreground"
          >
            访问 GitHub →
          </a>
        </div>
      </div>
    </div>
  )
}

function GamingContent({ steam }: { steam: SteamData | null }) {
  if (!steam) {
    return <EmptyState label="Gaming" hint="暂未获取到 Steam 数据" />
  }

  const featured = steam.recentlyPlayed[0] ?? steam.topGames[0] ?? null
  const profile = steam.profile

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl font-bold">Gaming</h3>
        <p className="eyebrow text-muted">Steam · 游戏</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatChip label="Steam 等级" value={steam.level != null ? String(steam.level) : '—'} />
        <StatChip label="拥有游戏" value={steam.totalGames != null ? String(steam.totalGames) : '—'} />
        <StatChip label="累计时长" value={formatMinutes(steam.totalMinutes)} />
      </div>

      {profile && (
        <div className="mb-8 flex items-center gap-4 rounded-md border border-border bg-card-background p-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
            <SafeImage
              src={profile.avatarUrl}
              alt={profile.name}
              className="!h-full !w-full object-cover"
              fallback={<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted-bg text-lg font-bold">{profile.name.charAt(0) || 'S'}</div>}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold text-foreground">{profile.name}</p>
            <p className="text-xs text-muted">
              {[profile.sinceYear != null ? `加入于 ${profile.sinceYear}` : null, profile.country ? `地区 ${profile.country}` : null, profile.online ? '在线' : '离线']
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <a
            href={steam.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="neo inline-flex shrink-0 items-center gap-2 bg-card-background px-3 py-2 text-sm font-semibold text-foreground"
          >
            主页 →
          </a>
        </div>
      )}

      {featured && <SteamFeaturedCard game={featured} />}

      {steam.recentlyPlayed.length > 0 && (
        <div className="mb-8">
          <p className="eyebrow mb-3 text-muted">最近游玩</p>
          <div className="divide-y divide-border">
            {steam.recentlyPlayed.slice(0, 5).map((g, i) => (
              <SteamGameRow
                key={g.appid}
                game={g}
                rank={i + 1}
                caption={g.playtime2weeksMinutes > 0 ? `近两周 ${formatMinutes(g.playtime2weeksMinutes)}` : `总时长 ${formatMinutes(g.playtimeForeverMinutes)}`}
              />
            ))}
          </div>
        </div>
      )}

      {steam.topGames.length > 0 && (
        <div>
          <p className="eyebrow mb-3 text-muted">时长排行</p>
          <div className="divide-y divide-border">
            {steam.topGames.slice(0, 6).map((g, i) => (
              <SteamGameRow key={g.appid} game={g} rank={i + 1} caption={`总时长 ${formatMinutes(g.playtimeForeverMinutes)}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BangumiContent({ games }: { games: BangumiGame[] }) {
  if (games.length === 0) {
    return <EmptyState label="Bangumi" hint="暂未获取到 Bangumi 收藏数据" />
  }

  const doneCount = games.filter((g) => g.status === 'done').length
  const rated = games.filter((g) => g.userRate != null)
  const avgRate = rated.length > 0 ? Math.round((rated.reduce((s, g) => s + (g.userRate ?? 0), 0) / rated.length) * 10) / 10 : null
  const recent = games.slice(0, 6)
  const featured = [...games]
    .sort((a, b) => (b.userRate ?? 0) - (a.userRate ?? 0) || (b.communityScore ?? 0) - (a.communityScore ?? 0))
    .slice(0, 8)

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl font-bold">Bangumi</h3>
        <p className="eyebrow text-muted">视觉小说 · Galgame</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatChip label="收藏" value={String(games.length)} />
        <StatChip label="玩过" value={String(doneCount)} />
        <StatChip label="平均评分" value={avgRate != null ? String(avgRate) : '—'} />
      </div>

      {featured.length > 0 && (
        <div className="mb-8">
          <p className="eyebrow mb-3 text-muted">精选收藏</p>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((g) => (
              <BangumiCard key={g.id} game={g} />
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <p className="eyebrow mb-3 text-muted">近期动态</p>
          <div className="divide-y divide-border">
            {recent.map((g) => (
              <BangumiFeedRow key={g.id} game={g} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function renderContent(key: DimensionKey, props: DimensionSelectorProps) {
  if (key === 'tech') return <TechContent tech={props.tech} />
  if (key === 'gaming') return <GamingContent steam={props.gaming} />
  return <BangumiContent games={props.other} />
}

function DimensionSelector(props: DimensionSelectorProps) {
  const [active, setActive] = useState<DimensionKey>('tech')
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageW, setStageW] = useState(1200)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const update = () => setStageW(el.offsetWidth || 1200)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const activeIndex = DIMENSIONS.findIndex((d) => d.key === active)
  const panelW = clampPanelWidth(stageW)
  const pos = computePositions(activeIndex, stageW, panelW)
  const transition = 'left 0.35s cubic-bezier(0.2, 0.7, 0.2, 1)'
  const colTop = (STAGE_H - COLUMN_H) / 2

  return (
    <div>
      <header className="mb-8 flex flex-col items-start gap-2">
        <p className="eyebrow text-primary">03 / Dimensions</p>
        <h2 className="text-2xl font-bold text-foreground">你想了解哪个维度的我</h2>
      </header>

      {/* 桌面：扇开推挤（xl 起） */}
      <div className="hidden xl:block">
        <div ref={stageRef} className="relative mx-auto" style={{ height: STAGE_H }}>
          {DIMENSIONS.map((d) => {
            const isActive = active === d.key
            return (
              <button
                key={d.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(d.key)}
                className={cn(
                  'absolute flex items-center justify-center rounded-md',
                  isActive
                    ? 'border-2 border-ink bg-accent text-ink-solid'
                    : 'border border-border bg-card-background text-foreground hover:bg-muted-bg',
                )}
                style={{
                  left: pos[d.key],
                  top: colTop,
                  width: COLUMN_W,
                  height: COLUMN_H,
                  writingMode: 'vertical-rl',
                  transition,
                }}
              >
                <span className="font-display text-2xl font-bold">{d.label}</span>
              </button>
            )
          })}

          <div
            role="tabpanel"
            className="absolute top-0 rounded-md border-2 border-ink bg-card-background text-foreground"
            style={{ left: pos.panel, width: panelW, height: STAGE_H, transition }}
          >
            <div key={active} className="fade-in h-full">
              {renderContent(active, props)}
            </div>
          </div>
        </div>
      </div>

      {/* 移动/中等屏：纵向手风琴 */}
      <div className="flex flex-col gap-3 xl:hidden">
        {DIMENSIONS.map((d) => (
          <div key={d.key} className="rounded-md border border-border bg-card-background">
            <button
              type="button"
              aria-expanded={active === d.key}
              onClick={() => setActive(d.key)}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3 text-left font-display text-xl font-bold',
                active === d.key ? 'bg-accent text-ink-solid' : 'text-foreground',
              )}
            >
              <span>{d.label}</span>
              <span aria-hidden="true" className="text-base">
                {active === d.key ? '−' : '+'}
              </span>
            </button>
            {active === d.key && <div className="border-t border-border p-4">{renderContent(d.key, props)}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DimensionSelector