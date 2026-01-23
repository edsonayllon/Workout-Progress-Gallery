import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useImagePreloader } from './useImagePreloader'

describe('useImagePreloader', () => {
  let createdImages
  let OriginalImage

  beforeEach(() => {
    createdImages = []
    OriginalImage = global.Image
    global.Image = class MockImage {
      constructor() {
        this._src = ''
        createdImages.push(this)
      }
      get src() {
        return this._src
      }
      set src(value) {
        this._src = value
      }
    }
  })

  afterEach(() => {
    global.Image = OriginalImage
    createdImages = []
  })

  const createPhotos = (count) =>
    Array.from({ length: count }, (_, i) => ({
      id: `photo-${i}`,
      imageUrl: `https://example.com/photo-${i}.jpg`,
    }))

  it('does nothing when photos array is empty', () => {
    renderHook(() => useImagePreloader([], 0))
    expect(createdImages.length).toBe(0)
  })

  it('does nothing when photos is null', () => {
    renderHook(() => useImagePreloader(null, 0))
    expect(createdImages.length).toBe(0)
  })

  it('preloads adjacent images', () => {
    const photos = createPhotos(5)
    renderHook(() => useImagePreloader(photos, 2, 1))

    const preloadedUrls = createdImages.map((img) => img.src)
    // From index 2, should preload index 1 and 3
    expect(preloadedUrls).toContain('https://example.com/photo-1.jpg')
    expect(preloadedUrls).toContain('https://example.com/photo-3.jpg')
  })

  it('preloads next images when at start', () => {
    const photos = createPhotos(5)
    renderHook(() => useImagePreloader(photos, 0, 2))

    const preloadedUrls = createdImages.map((img) => img.src)
    expect(preloadedUrls).toContain('https://example.com/photo-1.jpg')
    expect(preloadedUrls).toContain('https://example.com/photo-2.jpg')
  })

  it('preloads previous images when at end', () => {
    const photos = createPhotos(5)
    renderHook(() => useImagePreloader(photos, 4, 2))

    const preloadedUrls = createdImages.map((img) => img.src)
    expect(preloadedUrls).toContain('https://example.com/photo-3.jpg')
    expect(preloadedUrls).toContain('https://example.com/photo-2.jpg')
  })

  it('handles single photo without errors', () => {
    const photos = createPhotos(1)
    expect(() => {
      renderHook(() => useImagePreloader(photos, 0, 2))
    }).not.toThrow()
  })

  it('does not preload same image twice on re-render', () => {
    const photos = createPhotos(5)
    const { rerender } = renderHook(
      ({ index }) => useImagePreloader(photos, index, 1),
      { initialProps: { index: 2 } }
    )

    const initialCount = createdImages.length

    // Rerender with same index
    rerender({ index: 2 })

    // No new images should be created
    expect(createdImages.length).toBe(initialCount)
  })
})
