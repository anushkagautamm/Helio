import { useEffect, useRef, useState } from 'react'

/**
 * Tracks an element's rendered width so SVG charts can draw at true pixel
 * size — text and strokes stay crisp instead of being stretched by
 * preserveAspectRatio="none".
 */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth || fallback)
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [fallback])

  return { ref, width }
}

/** Rounds a raw axis step to 1, 2, 2.5 or 5 × 10ⁿ. */
export function niceStep(raw: number): number {
  if (!(raw > 0)) return 1
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const f = raw / magnitude
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * magnitude
}
