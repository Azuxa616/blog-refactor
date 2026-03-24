// Alpine.js 入口点 - 由 @astrojs/alpinejs 插件自动加载
import {
  pageExpand,
  navigation,
  modal,
  imageFallback,
  typewriter,
} from './lib/alpine-utils'

document.addEventListener('alpine:init', () => {
  Alpine.data('pageExpand', pageExpand)
  Alpine.data('navigation', navigation)
  Alpine.data('modal', modal)
  Alpine.data('imageFallback', imageFallback)
  Alpine.data('typewriter', typewriter)
})
