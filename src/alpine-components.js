// Alpine.js 组件注册文件
// 注册全局 Alpine 组件和 store

import { pageExpand, navigation, modal, imageFallback, typewriter } from './lib/alpine-utils'

// 注册全局 Alpine 组件
document.addEventListener('alpine:init', () => {
  // 页面展开状态管理
  Alpine.data('pageExpand', pageExpand)
  
  // 导航栏状态管理
  Alpine.data('navigation', navigation)
  
  // 模态框状态管理
  Alpine.data('modal', modal)
  
  // 图片加载错误处理
  Alpine.data('imageFallback', imageFallback)
  
  // 打字机效果
  Alpine.data('typewriter', typewriter)
  
  // 全局 store - 用于跨组件共享状态
  Alpine.store('appState', {
    theme: 'dark',
    currentCategory: 'all',
    searchQuery: '',
    
    setTheme(theme) {
      this.theme = theme
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }
    },
    
    setCurrentCategory(category) {
      this.currentCategory = category
    },
    
    setSearchQuery(query) {
      this.searchQuery = query
    }
  })
})
