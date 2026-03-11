'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Typewriter from '@/components/Typewriter'
import FooterBar from '@/components/FooterBar.astro'
import GithubCard from '@/components/GithubCard'
import BusinessCard from '@/components/BusinessCard'
import WebStatisticDataCard from '@/components/WebStatisticDataCard'
import { usePage } from '@/contexts/PageContext'

interface GitHubData {
  user: {
    avatar_url: string
    name: string
    login: string
    bio: string | null
    followers: number
    following: number
    public_repos: number
  }
  repos: Array<{
    id: number
    name: string
    description: string | null
    html_url: string
    updated_at: string
    language: string | null
    license: { name: string; spdx_id: string } | null
    stargazers_count: number
  }>
}

const ArrowAnimation = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="animate-bounce cursor-pointer" onClick={onClick}>
      <img src="/svgs/arrow-down.svg" alt="background" width={40} height={40} className="object-cover" />
    </div>
  )
}

export default function HomeClient() {
  const { isExpanded, setIsExpanded, isTransitioning, setIsTransitioning } = usePage()
  const [githubData, setGithubData] = useState<GitHubData | null>(null)
  const [githubLoading, setGithubLoading] = useState(true)
  const [githubError, setGithubError] = useState<string | null>(null)
  const throttleTimer = useRef<NodeJS.Timeout | null>(null)

  const expandPage = useCallback(() => {
    if (!isExpanded && !isTransitioning) {
      setIsExpanded(true)
      setIsTransitioning(true)
      setTimeout(() => {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
        setIsTransitioning(false)
      }, 100)
    }
  }, [isExpanded, isTransitioning, setIsExpanded, setIsTransitioning])

  const collapsePage = useCallback(() => {
    if (isExpanded && !isTransitioning) {
      setIsExpanded(false)
      setIsTransitioning(true)
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setIsTransitioning(false)
      }, 100)
    }
  }, [isExpanded, isTransitioning, setIsExpanded, setIsTransitioning])

  const handleWheel = useCallback((e: WheelEvent) => {
    const deltaY = e.deltaY

    if (deltaY > 0 && !isExpanded && !isTransitioning) {
      e.preventDefault()
      expandPage()
    } else if (deltaY < 0 && isExpanded && window.scrollY <= 100 && !isTransitioning) {
      e.preventDefault()
      collapsePage()
    }
  }, [isExpanded, isTransitioning, expandPage, collapsePage])

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  useEffect(() => {
    const fetchGithubData = async () => {
      try {
        setGithubLoading(true)
        setGithubError(null)
        const response = await fetch('/api/github')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || '获取 GitHub 数据失败')
        }
        setGithubData(data)
      } catch (error) {
        console.error('获取 GitHub 数据错误:', error)
        setGithubError(error instanceof Error ? error.message : '获取 GitHub 数据失败')
      } finally {
        setGithubLoading(false)
      }
    }
    fetchGithubData()
  }, [])

  return (
    <div className="font-sans flex flex-col items-center justify-items-center min-h-screen w-full">
      <main className="flex flex-col row-start-2 items-center sm:items-start w-full relative z-10">
        <div className="relative w-full h-full">
          <div className="fixed inset-0 z-0">
            <img src="/imgs/index-bg-img-03.png" alt="background" className="object-cover w-full h-full" />
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-center gap-4 min-h-screen w-full text-center">
          <div className="relative flex flex-col items-center justify-center gap-4 min-h-screen w-full text-center text-white">
            <h1 className="text-6xl font-bold">Welcome to Azuxa&apos;s BlogWorld</h1>
            <Typewriter
              initialText="Not just a blog, but"
              repeatedTextList={[" a notebook", " a showcase", " a ground", " a world"]}
              initialTypingSpeed={120}
              repeatedTypingSpeed={100}
              gapInterval={2000}
              loop={true}
              deleteSpeed={60}
              cursor="_"
              cursorBlinkInterval={500}
              className="text-3xl font-mono"
            />
          </div>
          <div className="absolute bottom-1/12 left-1/2">
            <ArrowAnimation onClick={expandPage} />
          </div>
        </div>

        <div style={{ height: '100vh', visibility: 'hidden', pointerEvents: 'none' }} />

        {isExpanded && (
          <div className="relative flex items-start justify-center w-full text-center gap-8 bg-background">
            <div className="flex flex-col items-center justify-center p-10 gap-8 rounded-2xl my-30 w-full">
              <GithubCard
                user={githubData?.user || null}
                repos={githubData?.repos || []}
                isLoading={githubLoading}
                error={githubError}
                learned={[
                  { name: "TypeScript", proficiency: 85, imgUrl: "/imgs/logo-ts.webp", docUrl: "https://www.typescriptlang.org/" },
                  { name: "React", proficiency: 75, imgUrl: "/imgs/logo-react.webp", docUrl: "https://zh-hans.react.dev/" },
                  { name: "Vue", proficiency: 65, imgUrl: "/imgs/logo-vue.webp", docUrl: "https://vuejs.org/" },
                  { name: "Ant Design", proficiency: 50, imgUrl: "/imgs/logo-antd.webp", docUrl: "https://ant.design/index-cn" },
                ]}
                practicing={[
                  { name: "Next.js", proficiency: 60, imgUrl: "/imgs/logo-nextjs.webp", docUrl: "https://nextjs.org/" },
                  { name: "Tailwind CSS", proficiency: 60, imgUrl: "/imgs/logo-tailwindcss.webp", docUrl: "https://tailwindcss.com/" },
                  { name: "Node.js", proficiency: 70, imgUrl: "/imgs/logo-nodejs.webp", docUrl: "https://nodejs.org/" },
                  { name: "FastApi", proficiency: 50, imgUrl: "/imgs/logo-fastapi.webp", docUrl: "https://fastapi.tiangolo.com/" }
                ]}
              />
            </div>
          </div>
        )}
      </main>
      {isExpanded && <FooterBar />}
    </div>
  )
}
