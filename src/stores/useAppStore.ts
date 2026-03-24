import { create } from 'zustand'

interface AppState {
  theme: 'light' | 'dark'
  currentCategory: string
  searchQuery: string
  isExpanded: boolean
  initialized: boolean
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setCurrentCategory: (category: string) => void
  setSearchQuery: (query: string) => void
  setIsExpanded: (expanded: boolean) => void
  init: () => void
}

const getStoredTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark'

  const storedTheme = localStorage.getItem('theme')
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const useAppStore = create<AppState>()((set, get) => ({
  theme: 'dark',
  currentCategory: 'all',
  searchQuery: '',
  isExpanded: false,
  initialized: false,

  init: () => {
    if (get().initialized) return

    const theme = getStoredTheme()
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme, initialized: true })
  },

  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
    set({ theme })
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(newTheme)
  },

  setCurrentCategory: (category) => set({ currentCategory: category }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setIsExpanded: (expanded) => set({ isExpanded: expanded }),
}))
