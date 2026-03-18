import { useEffect, useRef, useState } from 'react'

interface TypewriterProps {
  textList: string | string[]
  typingSpeed?: number
  deleteSpeed?: number
  gapInterval?: number
  cursorBlinkInterval?: number
  className?: string
}

function Typewriter({
  textList,
  typingSpeed = 100,
  deleteSpeed = 50,
  gapInterval = 2000,
  cursorBlinkInterval = 500,
  className = '',
}: TypewriterProps) {
  const texts = Array.isArray(textList) ? textList : [textList]
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    cursorIntervalRef.current = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, cursorBlinkInterval)

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current)
      }
    }
  }, [cursorBlinkInterval])

  useEffect(() => {
    const processNext = () => {
      const currentText = texts[currentIndex]

      if (!isDeleting) {
        if (displayedText.length < currentText.length) {
          const nextText = currentText.slice(0, displayedText.length + 1)
          setDisplayedText(nextText)
          timerRef.current = setTimeout(processNext, typingSpeed)
        } else {
          setIsDeleting(false)
          setCurrentIndex((prev) => (prev + 1) % texts.length)
          timerRef.current = setTimeout(processNext, gapInterval)
        }
      } else {
        if (displayedText.length > 0) {
          const nextText = displayedText.slice(0, -1)
          setDisplayedText(nextText)
          timerRef.current = setTimeout(processNext, deleteSpeed)
        } else {
          setIsDeleting(false)
          setCurrentIndex((prev) => (prev + 1) % texts.length)
          timerRef.current = setTimeout(processNext, gapInterval)
        }
      }
    }

    processNext()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [
    displayedText,
    currentIndex,
    isDeleting,
    texts,
    typingSpeed,
    deleteSpeed,
    gapInterval,
  ])

  return (
    <span className={className}>
      <span>{displayedText}</span>
      {showCursor && <span>|</span>}
    </span>
  )
}

export default Typewriter
