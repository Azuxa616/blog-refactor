import { Menu, X } from 'lucide-react'
import { memo, useState } from 'react'
import NavLinkButton from './NavLinkButton'

interface HeaderBarProps {
  isUseSwitch?: boolean
  className?: string
}

const HeaderBar = memo(function HeaderBar({
  isUseSwitch = true,
  className = '',
}: HeaderBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuItems = [
    { href: '/', label: '首页' },
    { href: '/articles', label: '文章' },
    { href: '/about', label: '关于' },
    { href: '/links', label: '友链' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex h-16 w-full items-center border px-4 transition-colors duration-300 sm:px-8 ${
        !isUseSwitch
          ? 'bg-white/60 backdrop-blur-sm text-black dark:text-white border-gray-200'
          : 'bg-transparent text-white'
      } ${className}`}
    >
      <div className="whitespace-nowrap text-lg font-bold sm:text-xl">
        Azuxa's Blog
      </div>
      <nav
        className="ml-6 hidden items-center gap-4 md:flex"
        aria-label="主导航"
      >
        {menuItems.map((item) => (
          <NavLinkButton
            key={item.href}
            href={item.href}
            label={item.label}
            isDarkUnderline={!isUseSwitch}
          />
        ))}
      </nav>
      <button
        type="button"
        className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-md md:hidden"
        aria-label={isMobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'}
        aria-controls="mobile-navigation"
        aria-expanded={isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
      >
        {isMobileMenuOpen ? (
          <X aria-hidden="true" />
        ) : (
          <Menu aria-hidden="true" />
        )}
      </button>
      {isMobileMenuOpen && (
        <nav
          id="mobile-navigation"
          className={`absolute top-16 right-0 left-0 border-b px-4 py-3 shadow-lg md:hidden ${
            isUseSwitch
              ? 'border-white/20 bg-black/85 text-white backdrop-blur-sm'
              : 'border-gray-200 bg-white text-black dark:bg-gray-900 dark:text-white'
          }`}
          aria-label="移动端主导航"
        >
          <div className="flex flex-col items-stretch gap-1">
            {menuItems.map((item) => (
              <NavLinkButton
                key={item.href}
                href={item.href}
                label={item.label}
                isDarkUnderline={!isUseSwitch}
                className="w-full"
              />
            ))}
          </div>
        </nav>
      )}
    </header>
  )
})

export default HeaderBar
