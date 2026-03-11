// Alpine.js 工具函数
// 用于管理全局状态和交互逻辑

/**
 * 页面展开状态管理
 * 用于首页的展开/收起交互
 */
export function pageExpand() {
  return {
    isExpanded: false,
    isTransitioning: false,
    
    /** 展开页面 */
    expand() {
      if (!this.isExpanded && !this.isTransitioning) {
        this.isExpanded = true
        this.isTransitioning = true
        setTimeout(() => {
          window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
          this.isTransitioning = false
        }, 100)
      }
    },
    
    /** 收起页面 */
    collapse() {
      if (this.isExpanded && !this.isTransitioning) {
        this.isExpanded = false
        this.isTransitioning = true
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          this.isTransitioning = false
        }, 100)
      }
    },
    
    /** 处理滚轮事件 */
    handleWheel(event) {
      const deltaY = event.deltaY
      
      if (deltaY > 0 && !this.isExpanded && !this.isTransitioning) {
        event.preventDefault()
        this.expand()
      } else if (deltaY < 0 && this.isExpanded && window.scrollY <= 100 && !this.isTransitioning) {
        event.preventDefault()
        this.collapse()
      }
    }
  }
}

/**
 * 导航栏状态管理
 * 用于管理导航栏的展开/收起状态
 */
export function navigation() {
  return {
    isExpanded: false,
    toggle() {
      this.isExpanded = !this.isExpanded
    },
    collapse() {
      this.isExpanded = false
    }
  }
}

/**
 * 模态框状态管理
 * 用于管理模态框的打开/关闭状态
 */
export function modal() {
  return {
    isOpen: false,
    open() {
      this.isOpen = true
      document.body.style.overflow = 'hidden'
    },
    close() {
      this.isOpen = false
      document.body.style.overflow = ''
    },
    toggle() {
      this.isOpen ? this.close() : this.open()
    }
  }
}

/**
 * 图片加载错误处理
 * 用于处理图片加载失败后的降级
 */
export function imageFallback() {
  return {
    currentSrc: '',
    fallbackSrc: '',
    init(src, fallback) {
      this.currentSrc = src
      this.fallbackSrc = fallback
    },
    handleError() {
      if (this.currentSrc !== this.fallbackSrc) {
        this.currentSrc = this.fallbackSrc
      }
    }
  }
}
