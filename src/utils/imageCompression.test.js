import { describe, it, expect } from 'vitest'
import {
  calculateDimensions,
  getOutputFilename,
  formatFileSize,
} from './imageCompression'

describe('calculateDimensions', () => {
  it('returns original dimensions if within max', () => {
    const result = calculateDimensions(800, 600, 1920)
    expect(result).toEqual({ width: 800, height: 600 })
  })

  it('returns original dimensions if exactly at max', () => {
    const result = calculateDimensions(1920, 1080, 1920)
    expect(result).toEqual({ width: 1920, height: 1080 })
  })

  it('scales down landscape image that exceeds max width', () => {
    const result = calculateDimensions(3840, 2160, 1920)
    expect(result).toEqual({ width: 1920, height: 1080 })
  })

  it('scales down portrait image that exceeds max height', () => {
    const result = calculateDimensions(2160, 3840, 1920)
    expect(result).toEqual({ width: 1080, height: 1920 })
  })

  it('scales down square image that exceeds max', () => {
    const result = calculateDimensions(4000, 4000, 1920)
    expect(result).toEqual({ width: 1920, height: 1920 })
  })

  it('handles very small max dimension', () => {
    const result = calculateDimensions(1000, 500, 100)
    expect(result).toEqual({ width: 100, height: 50 })
  })

  it('maintains aspect ratio for wide images', () => {
    const result = calculateDimensions(4000, 1000, 2000)
    expect(result.width).toBe(2000)
    expect(result.height).toBe(500)
    expect(result.width / result.height).toBeCloseTo(4000 / 1000)
  })

  it('maintains aspect ratio for tall images', () => {
    const result = calculateDimensions(1000, 4000, 2000)
    expect(result.height).toBe(2000)
    expect(result.width).toBe(500)
    expect(result.width / result.height).toBeCloseTo(1000 / 4000)
  })

  it('handles 1:1 aspect ratio', () => {
    const result = calculateDimensions(3000, 3000, 1500)
    expect(result).toEqual({ width: 1500, height: 1500 })
  })

  it('handles extreme aspect ratios (panorama)', () => {
    const result = calculateDimensions(10000, 1000, 2000)
    expect(result.width).toBe(2000)
    expect(result.height).toBe(200)
  })

  it('handles very small images', () => {
    const result = calculateDimensions(100, 50, 1920)
    expect(result).toEqual({ width: 100, height: 50 })
  })
})

describe('getOutputFilename', () => {
  it('changes extension to jpg for jpeg output', () => {
    expect(getOutputFilename('photo.png', 'image/jpeg')).toBe('photo.jpg')
  })

  it('changes extension to png for png output', () => {
    expect(getOutputFilename('photo.jpg', 'image/png')).toBe('photo.png')
  })

  it('handles files with multiple dots', () => {
    expect(getOutputFilename('my.photo.name.png', 'image/jpeg')).toBe('my.photo.name.jpg')
  })

  it('handles HEIC files', () => {
    expect(getOutputFilename('IMG_1234.HEIC', 'image/jpeg')).toBe('IMG_1234.jpg')
  })

  it('handles files without extension', () => {
    expect(getOutputFilename('photo', 'image/jpeg')).toBe('photo.jpg')
  })

  it('handles lowercase heic', () => {
    expect(getOutputFilename('photo.heic', 'image/jpeg')).toBe('photo.jpg')
  })

  it('defaults to jpg for unknown output types', () => {
    expect(getOutputFilename('photo.png', 'image/webp')).toBe('photo.jpg')
  })
})

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })

  it('handles zero', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('handles edge case at KB boundary', () => {
    expect(formatFileSize(1023)).toBe('1023 B')
    expect(formatFileSize(1024)).toBe('1.0 KB')
  })

  it('handles edge case at MB boundary', () => {
    expect(formatFileSize(1024 * 1024 - 1)).toBe('1024.0 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
  })

  it('formats large files', () => {
    expect(formatFileSize(15 * 1024 * 1024)).toBe('15.0 MB')
    expect(formatFileSize(100 * 1024 * 1024)).toBe('100.0 MB')
  })
})
