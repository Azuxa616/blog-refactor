import { useApp } from '@/context/AppContext'
import NavLinkButton from './NavLinkButton'

interface HeaderBarProps {
  isUseSwitch?: boolean
  className?: string
}

function HeaderBar({ isUseSwitch = true, className = '' }: HeaderBarProps) {
  const { isExpanded, setIsExpanded } = useApp()

  const menuItems = [
    { href: '/', label: '首页' },
    { href: '/articles', label: '文章' },
    { href: '/about', label: '关于' },
    { href: '/links', label: '友链' },
  ]

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-start w-full h-16 border px-8 gap-10 transition-colors duration-300 ${
        isExpanded || !isUseSwitch
          ? 'bg-white/60 backdrop-blur-sm text-black dark:text-white border-gray-200'
          : 'bg-transparent text-white'
      } ${className}`}
    >
      <div className="text-xl font-bold">Azuxa's BlogSpace</div>
      <div className="flex items-center gap-4">
        {menuItems.map((item) => (
          <NavLinkButton
            key={item.href}
            href={item.href}
            label={item.label}
            isDarkUnderline={isExpanded || !isUseSwitch}
          />
        ))}
      </div>
    </div>
  )
}

export default HeaderBar
