import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'

function FloatingActionButton() {
  const { theme, toggleTheme } = useApp()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

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
        {theme === 'light' ? (
          <img
            src="/svgs/moon.svg"
            width="20"
            height="20"
            className="text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors"
            alt="深色模式"
          />
        ) : (
          <img
            src="/svgs/sun.svg"
            width="20"
            height="20"
            className="text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors"
            alt="浅色模式"
          />
        )}
      </button>
    </div>
  )
}

export default FloatingActionButton
