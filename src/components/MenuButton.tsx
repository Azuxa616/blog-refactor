'use client'

interface MenuButtonProps {
  children: React.ReactNode
  href: string
  textColor?: string
}

export default function MenuButton({ children, href, textColor = 'white' }: MenuButtonProps) {
    const isWhiteText = textColor === 'white'

    return (
        <a
            href={href}
            className={`relative px-4 py-2 transition-colors duration-200 font-semibold
                       after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5
                       after:transition-all after:duration-300 after:ease-out
                       hover:after:w-full ${isWhiteText ? 'after:bg-white' : 'after:bg-black'}`}
        >
            {children}
        </a>
    )
}
