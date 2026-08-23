import { fetchJson } from './http'
import { githubData } from '@/data/github'
import type { GitHubData, GitHubProfile, GitHubRepoSummary } from '@/types'

interface GitHubUserRaw {
  login?: string
  name?: string | null
  bio?: string | null
  avatar_url?: string
  followers?: number
  following?: number
  public_repos?: number
  html_url?: string
}

interface GitHubRepoRaw {
  id?: number
  name?: string
  description?: string | null
  html_url?: string
  updated_at?: string
  language?: string | null
  stargazers_count?: number
  forks_count?: number
}

function toProfile(username: string, u: GitHubUserRaw | undefined): GitHubProfile {
  if (u && u.login) {
    return {
      login: u.login,
      name: u.name ?? u.login,
      bio: u.bio ?? '',
      avatarUrl: u.avatar_url ?? '',
      followers: u.followers ?? 0,
      following: u.following ?? 0,
      publicRepos: u.public_repos ?? 0,
      htmlUrl: u.html_url ?? 'https://github.com/' + u.login,
    }
  }
  return {
    login: githubData.user.login,
    name: githubData.user.name,
    bio: githubData.user.bio,
    avatarUrl: githubData.user.avatar_url,
    followers: githubData.user.followers,
    following: githubData.user.following,
    publicRepos: githubData.user.public_repos,
    htmlUrl: 'https://github.com/' + githubData.user.login,
  }
}

function toRepo(r: GitHubRepoRaw): GitHubRepoSummary {
  return {
    id: r.id ?? 0,
    name: r.name ?? '',
    description: r.description ?? null,
    htmlUrl: r.html_url ?? '',
    updatedAt: r.updated_at ?? '',
    language: r.language ?? null,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
  }
}

export async function getGitHubData(): Promise<GitHubData> {
  const username = (import.meta.env.GITHUB_NAME ?? '').trim() || githubData.user.login
  const token = import.meta.env.GITHUB_TOKEN
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = 'Bearer ' + token

  const [userRaw, reposRaw] = await Promise.all([
    fetchJson<GitHubUserRaw>('https://api.github.com/users/' + username, { headers }),
    fetchJson<GitHubRepoRaw[]>('https://api.github.com/users/' + username + '/repos?sort=updated&per_page=30', { headers }),
  ])

  const profile = toProfile(username, userRaw ?? undefined)
  const repos: GitHubRepoSummary[] = (reposRaw ?? [])
    .filter((r) => r.id != null && r.name)
    .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
    .slice(0, 6)
    .map(toRepo)

  if (repos.length === 0) {
    repos.push(
      ...githubData.repos.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        htmlUrl: r.html_url,
        updatedAt: r.updated_at,
        language: r.language,
        stars: r.stargazers_count,
        forks: 0,
      })),
    )
  }

  return { profile, repos }
}