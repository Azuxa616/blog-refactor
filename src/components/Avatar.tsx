'use client'

interface AvatarProps {
  src?: string
  width?: number
  height?: number
  alt?: string
}

export default function Avatar({
  src = "/imgs/butterfly-icon.png", 
  width = 100, 
  height = 100,
  alt = "avatar"
}: AvatarProps) {
    return (
        <div>
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                className="rounded-full"
            />
        </div>
    )
}
