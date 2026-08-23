import { cn } from '@/lib/utils'

interface NavLinkButtonProps {
  /** 链接地址 */
  href: string
  /** 按钮文本 */
  label: string
  /** 额外的 CSS 类名 */
  className?: string
}

function NavLinkButton({
  href,
  label,
  className = '',
}: NavLinkButtonProps) {
  return (
    <a
      href={href}
      className={cn(
        'relative px-3 py-2 font-mono text-sm font-semibold uppercase tracking-widest',
        'transition-colors duration-200 hover:text-primary',
        className,
      )}
    >
      {label}
    </a>
  )
}

export default NavLinkButton
