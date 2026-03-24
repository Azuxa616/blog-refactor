import { useAppStore } from '../stores/useAppStore'

export default (Alpine: typeof import('alpinejs')) => {
  Alpine.store('appState', {
    get theme() {
      return useAppStore.getState().theme
    },
    set theme(value: 'light' | 'dark') {
      useAppStore.getState().setTheme(value)
    },
    get currentCategory() {
      return useAppStore.getState().currentCategory
    },
    set currentCategory(value: string) {
      useAppStore.getState().setCurrentCategory(value)
    },
    get searchQuery() {
      return useAppStore.getState().searchQuery
    },
    set searchQuery(value: string) {
      useAppStore.getState().setSearchQuery(value)
    },
    get isExpanded() {
      return useAppStore.getState().isExpanded
    },
    set isExpanded(value: boolean) {
      useAppStore.getState().setIsExpanded(value)
    },

    setTheme(theme: 'light' | 'dark') {
      useAppStore.getState().setTheme(theme)
    },

    toggleTheme() {
      useAppStore.getState().toggleTheme()
    },

    setCurrentCategory(category: string) {
      useAppStore.getState().setCurrentCategory(category)
    },

    setSearchQuery(query: string) {
      useAppStore.getState().setSearchQuery(query)
    },
  })
}
