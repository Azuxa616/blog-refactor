'use client'

interface CardProps {
    children: React.ReactNode
    className?: string
    showDecorativeBg?: boolean
    showBottomGradient?: boolean
    maxWidth?: string
    padding?: string
}

export default function Card({
    children,
    className = "",
    showDecorativeBg = true,
    padding = "p-8"
}: CardProps) {
    return (
        <div className={`relative flex 
        bg-card-background  backdrop-blur-sm border 
         border-white/20 shadow-xl rounded-2xl ${padding} hover:shadow-2xl transition-all duration-300  ${className}`}>
            {children}
        </div>
    );
}
