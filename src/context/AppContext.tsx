import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react'
import type { ReactNode } from 'react'

interface AppState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  currentCategory: string
  setCurrentCategory: (category: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}

const AppContext = createContext<AppState | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
}

function AppProvider({ children }: AppProviderProps) {
  // 硬编码初始值为 'dark' 匹配 SSR <html class="dark">，避免任何水合差异
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark')
  const [currentCategory, setCurrentCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const initialized = useRef(false)

  // 仅在首次挂载时从 localStorage 读取，避免水合循环
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      const storedTheme = localStorage.getItem('theme')
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setThemeState(storedTheme)
      }
    }
  }, [])

  // theme 变化时同步 DOM 和 localStorage
  useEffect(() => {
    if (!initialized.current) return
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo<AppState>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      currentCategory,
      setCurrentCategory,
      searchQuery,
      setSearchQuery,
      isExpanded,
      setIsExpanded,
    }),
    [theme, setTheme, toggleTheme, currentCategory, searchQuery, isExpanded]
  )

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  )
}

function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export { AppProvider, useApp }
