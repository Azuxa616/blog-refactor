import { useEffect, useState, useCallback, memo } from 'react'

const FloatingActionButton = memo(function FloatingActionButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    // 从 DOM class 读取初始主题，避免依赖 Context
    setIsDark(document.documentElement.classList.contains('dark'))

    const handleScroll = () => {
      setIsVisible(window.scrollY > 0)
    }

    // 监听 DOM 变化来同步主题状态（Alpine 可能切换主题）
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const toggleTheme = useCallback(() => {
    // 通过触发 Alpine store 来切换主题
    const html = document.documentElement
    const isCurrentlyDark = html.classList.contains('dark')
    html.classList.toggle('dark', !isCurrentlyDark)
    localStorage.setItem('theme', isCurrentlyDark ? 'light' : 'dark')
    // 同步 Alpine store
    if ((window as any).Alpine?.$store?.appState) {
      ;(window as any).Alpine.$store.appState.setTheme(
        isCurrentlyDark ? 'light' : 'dark'
      )
    }
    setIsDark(!isCurrentlyDark)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 transition-all duration-300 ease-in-out">
      <button
        onClick={scrollToTop}
        className={`w-12 h-12 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group ${
          !isVisible && 'opacity-0 pointer-events-none'
        }`}
        aria-label="回到顶部"
      >
        <img
          src="/svgs/arrow-up.svg"
          width="20"
          height="20"
          className="text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors"
          alt="回到顶部"
        />
      </button>

      <button
        onClick={toggleTheme}
        className="w-12 h-12 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        aria-label="切换主题"
      >
        {isDark ? (
          <img
            src="/svgs/sun.svg"
            width="20"
            height="20"
            className="text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors"
            alt="浅色模式"
          />
        ) : (
          <img
            src="/svgs/moon.svg"
            width="20"
            height="20"
            className="text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors"
            alt="深色模式"
          />
        )}
      </button>
    </div>
  )
})

export default FloatingActionButton
