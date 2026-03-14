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
    handleWheel(event: WheelEvent) {
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
    init(src: string, fallback: string): void {
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

/**
 * 打字机效果
 * 用于实现文字逐字显示的效果
 */
export function typewriter() {
  return {
    displayedInitialText: '',
    dynamicText: '',
    currentIndex: 0,
    phase: 'initial',
    showCursor: true,
    isDeleting: false,
    timer: null as ReturnType<typeof setTimeout> | null,
    cursorInterval: null as ReturnType<typeof setInterval> | null,
    initialText: '',
    initialTypingSpeed: 100,
    repeatedTextList: [] as string[],
    repeatedTypingSpeed: 100,
    deleteSpeed: 50,
    gapInterval: 2000,
    cursorBlinkInterval: 500,
    cursor: true,
    loop: true,

    getCurrentTargetText(): string {
      return (this.phase === 'typing' || this.phase === 'deleting')
        ? this.repeatedTextList[this.currentIndex] || ''
        : ''
    },

    next(): void {
      switch(this.phase) {
        case 'initial':
          if (this.initialText) {
            if (this.displayedInitialText.length < this.initialText.length) {
              this.phase = 'typing'
              this.type(this.initialText, this.displayedInitialText.length + 1, 'displayedInitialText', this.initialTypingSpeed)
            } else {
              this.phase = this.repeatedTextList.length > 0 ? 'waiting' : 'complete'
            }
          } else {
            this.phase = 'waiting'
          }
          break

        case 'waiting':
          if (this.repeatedTextList.length > 0) {
            this.isDeleting = !this.isDeleting
            this.phase = this.isDeleting ? 'deleting' : 'typing'
            if (this.timer) clearTimeout(this.timer)
            this.timer = setTimeout(() => this.next(), this.gapInterval)
          }
          break

        case 'typing':
          const targetText = this.getCurrentTargetText()
          if (this.dynamicText.length < targetText.length) {
            this.type(targetText, this.dynamicText.length + 1, 'dynamicText', this.repeatedTypingSpeed)
          } else {
            this.phase = 'waiting'
            if (this.timer) clearTimeout(this.timer)
            this.timer = setTimeout(() => this.next(), this.gapInterval)
          }
          break

        case 'deleting':
          if (this.dynamicText.length > 0) {
            this.deleteChar(this.deleteSpeed)
          } else {
            this.currentIndex = (this.currentIndex + 1) % this.repeatedTextList.length
            if (this.loop || this.currentIndex !== 0) {
              this.phase = 'waiting'
              if (this.timer) clearTimeout(this.timer)
              this.timer = setTimeout(() => this.next(), this.gapInterval)
            } else {
              this.phase = 'complete'
            }
          }
          break

        case 'complete':
          break
      }
    },

    type(text: string, length: number, targetVar: 'displayedInitialText' | 'dynamicText', speed: number): void {
      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this[targetVar] = text.slice(0, length)
        this.next()
      }, speed)
    },

    deleteChar(speed: number): void {
      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.dynamicText = this.dynamicText.slice(0, -1)
        this.next()
      }, speed)
    },

    init(_src?: string, _fallback?: string): void {
      if (this.cursor) {
        this.cursorInterval = setInterval(() => {
          this.showCursor = !this.showCursor
        }, this.cursorBlinkInterval)
      }
      this.next()
    }
  }
}
