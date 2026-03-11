'use client'

import { useState, useEffect, useCallback } from 'react'

interface TypewriterProps {
    initialText?: string
    repeatedTextList?: string[]
    initialTypingSpeed?: number
    repeatedTypingSpeed?: number
    gapInterval?: number
    loop?: boolean
    deleteSpeed?: number
    cursor?: string
    cursorBlinkInterval?: number
    className?: string
}

type Phase = 'initial' | 'waiting' | 'typing' | 'deleting' | 'complete'

export default function Typewriter({
    initialText = '',
    repeatedTextList = [],
    initialTypingSpeed = 100,
    repeatedTypingSpeed = 100,
    gapInterval = 2000,
    loop = true,
    deleteSpeed = 50,
    cursor = '|',
    cursorBlinkInterval = 500,
    className = ''
}: TypewriterProps) {
    const [displayedInitialText, setDisplayedInitialText] = useState('')
    const [dynamicText, setDynamicText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [phase, setPhase] = useState<Phase>('initial')
    const [showCursor, setShowCursor] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (!cursor) return

        const blinkInterval = setInterval(() => {
            setShowCursor(prev => !prev)
        }, cursorBlinkInterval)

        return () => clearInterval(blinkInterval)
    }, [cursor, cursorBlinkInterval])

    const getCurrentTargetText = useCallback(() => {
        if (repeatedTextList.length > 0) {
            return repeatedTextList[currentIndex]
        }
        return ''
    }, [repeatedTextList, currentIndex])

    useEffect(() => {
        const targetText = getCurrentTargetText()

        switch (phase) {
            case 'initial':
                if (initialText) {
                    if (displayedInitialText.length < initialText.length) {
                        const timer = setTimeout(() => {
                            setDisplayedInitialText(initialText.slice(0, displayedInitialText.length + 1))
                        }, initialTypingSpeed)
                        return () => clearTimeout(timer)
                    } else {
                        if (repeatedTextList.length > 0) {
                            setPhase('waiting')
                        } else {
                            setPhase('complete')
                        }
                    }
                } else {
                    setPhase('waiting')
                }
                break

            case 'waiting':
                if (repeatedTextList.length > 0) {
                    const timer = setTimeout(() => {
                        setPhase(isDeleting ? 'deleting' : 'typing')
                        setIsDeleting(prev => !prev)
                    }, gapInterval)
                    return () => clearTimeout(timer)
                }
                break

            case 'typing':
                if (dynamicText.length < targetText.length) {
                    const timer = setTimeout(() => {
                        setDynamicText(targetText.slice(0, dynamicText.length + 1))
                    }, repeatedTypingSpeed)
                    return () => clearTimeout(timer)
                } else {
                    setPhase('waiting')
                }
                break

            case 'deleting':
                if (dynamicText.length > 0) {
                    const timer = setTimeout(() => {
                        setDynamicText(dynamicText.slice(0, -1))
                    }, deleteSpeed)
                    return () => clearTimeout(timer)
                } else {
                    const nextIndex = (currentIndex + 1) % repeatedTextList.length
                    setCurrentIndex(nextIndex)

                    if (loop || nextIndex !== 0) {
                        setPhase('waiting')
                    } else {
                        setPhase('complete')
                    }
                }
                break

            case 'complete':
                break
        }
    }, [
        phase,
        displayedInitialText,
        dynamicText,
        currentIndex,
        initialText,
        repeatedTextList,
        initialTypingSpeed,
        repeatedTypingSpeed,
        gapInterval,
        deleteSpeed,
        loop,
        isDeleting,
        getCurrentTargetText
    ])

    return (
        <span className={className}>
            {displayedInitialText}
            {dynamicText}
            {cursor && showCursor && <span>{cursor}</span>}
        </span>
    )
}
