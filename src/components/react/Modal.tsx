import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen?: boolean
  onClose?: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  children?: React.ReactNode
  className?: string
}

function Modal({
  isOpen = false,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  children,
  className = '',
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const sizeClasses = {
    sm: 'w-96',
    md: 'w-[500px]',
    lg: 'w-[700px]',
    xl: 'w-[900px]',
    full: 'w-[95vw] max-w-[1200px]',
  }

  const showHeader = !!(title || showCloseButton)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-[#5252523c] bg-opacity-60 overflow-y-auto h-full w-full z-50"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative top-20 mx-auto p-5 border shadow-lg rounded-md bg-white',
          sizeClasses[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mt-3">
          {showHeader && (
            <div className="flex items-center justify-between mb-4">
              {title && (
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="关闭"
                >
                  <img
                    src="/svgs/close.svg"
                    width="24"
                    height="24"
                    alt="关闭"
                  />
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
