import {
  imageFallback,
  modal,
  navigation,
  pageExpand,
  typewriter,
} from './lib/alpine-utils'

export default function setupAlpine(Alpine) {
  Alpine.data('pageExpand', pageExpand)
  Alpine.data('navigation', navigation)
  Alpine.data('modal', modal)
  Alpine.data('imageFallback', imageFallback)
  Alpine.data('typewriter', typewriter)

  Alpine.store('appState', {
    theme: (() => {
      const storedTheme = localStorage.getItem('theme')
      if (storedTheme) {
        return storedTheme === 'dark' ? 'dark' : 'light'
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    })(),
    currentCategory: 'all',
    searchQuery: '',
    isExpanded: false,

    setTheme(theme) {
      this.theme = theme
      document.documentElement.classList.toggle('dark', theme === 'dark')
      localStorage.setItem('theme', theme)
    },

    toggleTheme() {
      const newTheme = this.theme === 'dark' ? 'light' : 'dark'
      this.setTheme(newTheme)
      return newTheme
    },

    setCurrentCategory(category) {
      this.currentCategory = category
    },

    setSearchQuery(query) {
      this.searchQuery = query
    },
  })
}
