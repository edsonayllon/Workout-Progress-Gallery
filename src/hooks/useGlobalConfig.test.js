import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGlobalConfig, DEFAULT_CONFIG, mergeConfigs } from './useGlobalConfig'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}))

vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123' } },
}))

import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

describe('useGlobalConfig', () => {
  let authCallback
  let snapshotCallback
  let snapshotErrorCallback

  beforeEach(() => {
    vi.clearAllMocks()

    onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback
      return vi.fn()
    })

    onSnapshot.mockImplementation((ref, onSuccess, onError) => {
      snapshotCallback = onSuccess
      snapshotErrorCallback = onError
      return vi.fn()
    })

    doc.mockReturnValue({})
  })

  describe('DEFAULT_CONFIG', () => {
    it('has correct default values', () => {
      expect(DEFAULT_CONFIG).toEqual({
        unitSystem: 'imperial',
        measurements: ['Waist', 'Chest', 'Arms'],
        ratios: [],
      })
    })
  })

  describe('initial state', () => {
    it('starts with default config', () => {
      const { result } = renderHook(() => useGlobalConfig())

      expect(result.current.globalConfig).toEqual(DEFAULT_CONFIG)
    })
  })

  describe('without authenticated user', () => {
    it('uses default config when no user', () => {
      const { result } = renderHook(() => useGlobalConfig())

      act(() => {
        authCallback(null)
      })

      expect(result.current.globalConfig).toEqual(DEFAULT_CONFIG)
      expect(result.current.isLoaded).toBe(true)
    })
  })

  describe('with authenticated user', () => {
    it('subscribes to config document', () => {
      renderHook(() => useGlobalConfig())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      expect(onSnapshot).toHaveBeenCalled()
    })

    it('loads config from Firestore', () => {
      const { result } = renderHook(() => useGlobalConfig())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      act(() => {
        snapshotCallback({
          exists: () => true,
          data: () => ({
            unitSystem: 'metric',
            measurements: ['Waist', 'Hips'],
            ratios: [{ name: 'W-to-H', numerator: 'Waist', denominator: 'Hips' }],
          }),
        })
      })

      expect(result.current.globalConfig).toEqual({
        unitSystem: 'metric',
        measurements: ['Waist', 'Hips'],
        ratios: [{ name: 'W-to-H', numerator: 'Waist', denominator: 'Hips' }],
      })
      expect(result.current.isLoaded).toBe(true)
    })

    it('uses defaults when document does not exist', () => {
      const { result } = renderHook(() => useGlobalConfig())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      act(() => {
        snapshotCallback({
          exists: () => false,
          data: () => null,
        })
      })

      expect(result.current.globalConfig).toEqual(DEFAULT_CONFIG)
    })

    it('handles snapshot errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => useGlobalConfig())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      act(() => {
        snapshotErrorCallback(new Error('Firestore error'))
      })

      expect(result.current.globalConfig).toEqual(DEFAULT_CONFIG)
      expect(result.current.isLoaded).toBe(true)
      consoleSpy.mockRestore()
    })
  })

  describe('updateGlobalConfig', () => {
    it('updates config in Firestore', async () => {
      setDoc.mockResolvedValue()

      const { result } = renderHook(() => useGlobalConfig())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      await act(async () => {
        await result.current.updateGlobalConfig({
          unitSystem: 'metric',
          measurements: ['Waist'],
          ratios: [],
        })
      })

      expect(setDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          unitSystem: 'metric',
          measurements: ['Waist'],
          ratios: [],
        }),
        { merge: true }
      )
    })

  })
})

describe('mergeConfigs', () => {
  const globalConfig = {
    unitSystem: 'imperial',
    measurements: ['Waist', 'Chest'],
    ratios: [{ name: 'Test', numerator: 'Waist', denominator: 'Chest' }],
  }

  it('returns global config with isInherited when no gallery config', () => {
    const result = mergeConfigs(globalConfig, null)

    expect(result).toEqual({
      ...globalConfig,
      isInherited: true,
    })
  })

  it('returns global config with isInherited when gallery config is undefined', () => {
    const result = mergeConfigs(globalConfig, undefined)

    expect(result).toEqual({
      ...globalConfig,
      isInherited: true,
    })
  })

  it('uses gallery config values when provided', () => {
    const galleryConfig = {
      unitSystem: 'metric',
      measurements: ['Hips'],
      ratios: [],
    }

    const result = mergeConfigs(globalConfig, galleryConfig)

    expect(result).toEqual({
      unitSystem: 'metric',
      measurements: ['Hips'],
      ratios: [],
      isInherited: false,
    })
  })

  it('falls back to global for missing gallery config fields', () => {
    const galleryConfig = {
      unitSystem: 'metric',
      // measurements and ratios not specified
    }

    const result = mergeConfigs(globalConfig, galleryConfig)

    expect(result.unitSystem).toBe('metric')
    expect(result.measurements).toEqual(['Waist', 'Chest'])
    expect(result.ratios).toEqual([{ name: 'Test', numerator: 'Waist', denominator: 'Chest' }])
    expect(result.isInherited).toBe(false)
  })

  it('handles empty global ratios', () => {
    const globalWithNoRatios = { ...globalConfig, ratios: undefined }
    const galleryConfig = { unitSystem: 'metric' }

    const result = mergeConfigs(globalWithNoRatios, galleryConfig)

    expect(result.ratios).toEqual([])
  })
})
