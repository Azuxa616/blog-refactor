import { useEffect, useRef, useState, useCallback } from 'react'

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

  // 用 ref 追踪打字状态，避免 useEffect 依赖 state
  const stateRef = useRef({
    displayedText: '',
    currentIndex: 0,
    isDeleting: false,
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 同步 ref 和 state
  stateRef.current = { displayedText, currentIndex, isDeleting }

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
      const { displayedText, currentIndex, isDeleting } = stateRef.current
      const currentText = texts[currentIndex]

      if (!isDeleting) {
        if (displayedText.length < currentText.length) {
          setDisplayedText(currentText.slice(0, displayedText.length + 1))
          timerRef.current = setTimeout(processNext, typingSpeed)
        } else {
          setIsDeleting(true)
          setCurrentIndex((prev) => (prev + 1) % texts.length)
          timerRef.current = setTimeout(processNext, gapInterval)
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1))
          timerRef.current = setTimeout(processNext, deleteSpeed)
        } else {
          setIsDeleting(false)
          setCurrentIndex((prev) => (prev + 1) % texts.length)
          timerRef.current = setTimeout(processNext, gapInterval)
        }
      }
    }

    // 首次启动
    processNext()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span className={className}>
      <span>{displayedText}</span>
      {showCursor && <span>|</span>}
    </span>
  )
}

export default Typewriter
