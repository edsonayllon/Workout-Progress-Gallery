import { useEffect, useRef } from 'react'

/**
 * Preloads images for smoother navigation between photos.
 * Preloads the next and previous images relative to the current index.
 */
export function useImagePreloader(photos, currentIndex, preloadCount = 2) {
  const preloadedUrls = useRef(new Set())

  useEffect(() => {
    if (!photos || photos.length === 0) return

    const urlsToPreload = []

    // Collect URLs to preload (prev and next images)
    for (let i = 1; i <= preloadCount; i++) {
      // Next images
      const nextIndex = currentIndex + i
      if (nextIndex < photos.length && photos[nextIndex]?.imageUrl) {
        urlsToPreload.push(photos[nextIndex].imageUrl)
      }

      // Previous images
      const prevIndex = currentIndex - i
      if (prevIndex >= 0 && photos[prevIndex]?.imageUrl) {
        urlsToPreload.push(photos[prevIndex].imageUrl)
      }
    }

    // Preload images that haven't been preloaded yet
    urlsToPreload.forEach((url) => {
      if (!preloadedUrls.current.has(url)) {
        const img = new Image()
        img.src = url
        preloadedUrls.current.add(url)
      }
    })

    // Clean up old preloaded URLs to prevent memory bloat
    // Keep only URLs within a reasonable range
    if (preloadedUrls.current.size > 20) {
      const currentUrls = new Set(
        photos
          .slice(
            Math.max(0, currentIndex - preloadCount * 2),
            Math.min(photos.length, currentIndex + preloadCount * 2 + 1)
          )
          .map((p) => p.imageUrl)
          .filter(Boolean)
      )

      preloadedUrls.current.forEach((url) => {
        if (!currentUrls.has(url)) {
          preloadedUrls.current.delete(url)
        }
      })
    }
  }, [photos, currentIndex, preloadCount])
}
