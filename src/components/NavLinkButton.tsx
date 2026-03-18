import { cn } from '@/lib/utils'

interface NavLinkButtonProps {
  /** 链接地址 */
  href: string
  /** 按钮文本 */
  label: string
  /** 是否使用深色下划线（默认为 false，使用浅色下划线） */
  isDarkUnderline?: boolean
  /** 额外的 CSS 类名 */
  className?: string
}

function NavLinkButton({
  href,
  label,
  isDarkUnderline = false,
  className = '',
}: NavLinkButtonProps) {
  return (
    <a
      href={href}
      className={cn(
        'relative px-4 py-2 transition-colors duration-200 font-semibold nav-link-underline text-inherit hover:text-inherit',
        isDarkUnderline
          ? 'nav-link-underline-dark'
          : 'nav-link-underline-light',
        className,
      )}
    >
      {label}
    </a>
  )
}

export default NavLinkButton
