import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGalleries } from './useGalleries'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  writeBatch: vi.fn(),
  getDocs: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}))

vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123' } },
}))

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

describe('useGalleries', () => {
  let authCallback
  let snapshotCallback
  let snapshotErrorCallback

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup auth mock
    onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback
      return vi.fn()
    })

    // Setup Firestore snapshot mock
    onSnapshot.mockImplementation((query, onSuccess, onError) => {
      snapshotCallback = onSuccess
      snapshotErrorCallback = onError
      return vi.fn()
    })

    // Setup query mock
    query.mockReturnValue({})
    collection.mockReturnValue({})
    where.mockReturnValue({})
  })

  describe('initial state', () => {
    it('starts with empty galleries', () => {
      const { result } = renderHook(() => useGalleries())

      expect(result.current.galleries).toEqual([])
      expect(result.current.currentGallery).toBe(null)
      expect(result.current.currentGalleryId).toBe(null)
    })

    it('sets isLoaded to true when no user', async () => {
      const { result } = renderHook(() => useGalleries())

      // Simulate no user
      act(() => {
        authCallback(null)
      })

      expect(result.current.isLoaded).toBe(true)
      expect(result.current.galleries).toEqual([])
    })
  })

  describe('with authenticated user', () => {
    beforeEach(() => {
      addDoc.mockResolvedValue({ id: 'new-gallery-id' })
      getDocs.mockResolvedValue({ docs: [] })
      writeBatch.mockReturnValue({
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(),
      })
    })

    it('subscribes to galleries when user is authenticated', () => {
      renderHook(() => useGalleries())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      expect(onSnapshot).toHaveBeenCalled()
    })

    it('sets galleries from snapshot', () => {
      const { result } = renderHook(() => useGalleries())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockDocs = [
        { id: 'gallery-1', data: () => ({ name: 'Default', createdAt: { toMillis: () => 1000 } }) },
        { id: 'gallery-2', data: () => ({ name: 'Front', createdAt: { toMillis: () => 2000 } }) },
      ]

      act(() => {
        snapshotCallback({ docs: mockDocs })
      })

      expect(result.current.galleries).toHaveLength(2)
      expect(result.current.galleries[0].name).toBe('Default')
      expect(result.current.galleries[1].name).toBe('Front')
    })

    it('sets currentGalleryId to first gallery', () => {
      const { result } = renderHook(() => useGalleries())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockDocs = [
        { id: 'gallery-1', data: () => ({ name: 'Default', createdAt: { toMillis: () => 1000 } }) },
      ]

      act(() => {
        snapshotCallback({ docs: mockDocs })
      })

      expect(result.current.currentGalleryId).toBe('gallery-1')
      expect(result.current.currentGallery.name).toBe('Default')
    })

    it('handles snapshot errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => useGalleries())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      act(() => {
        snapshotErrorCallback(new Error('Firestore error'))
      })

      expect(result.current.isLoaded).toBe(true)
      consoleSpy.mockRestore()
    })
  })

  describe('createGallery', () => {
    beforeEach(() => {
      addDoc.mockResolvedValue({ id: 'new-gallery-id' })
    })

    it('creates a new gallery', async () => {
      const { result } = renderHook(() => useGalleries())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      await act(async () => {
        const id = await result.current.createGallery('New Gallery')
        expect(id).toBe('new-gallery-id')
      })

      expect(addDoc).toHaveBeenCalled()
    })

    it('trims gallery name', async () => {
      const { result } = renderHook(() => useGalleries())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      await act(async () => {
        await result.current.createGallery('  Trimmed Name  ')
      })

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: 'Trimmed Name' })
      )
    })
  })

  describe('renameGallery', () => {
    it('updates gallery name', async () => {
      updateDoc.mockResolvedValue()
      doc.mockReturnValue({})

      const { result } = renderHook(() => useGalleries())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      await act(async () => {
        await result.current.renameGallery('gallery-1', 'New Name')
      })

      expect(updateDoc).toHaveBeenCalledWith({}, { name: 'New Name' })
    })
  })

  describe('selectGallery', () => {
    it('changes current gallery', () => {
      const { result } = renderHook(() => useGalleries())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockDocs = [
        { id: 'gallery-1', data: () => ({ name: 'Default', createdAt: { toMillis: () => 1000 } }) },
        { id: 'gallery-2', data: () => ({ name: 'Front', createdAt: { toMillis: () => 2000 } }) },
      ]

      act(() => {
        snapshotCallback({ docs: mockDocs })
      })

      expect(result.current.currentGalleryId).toBe('gallery-1')

      act(() => {
        result.current.selectGallery('gallery-2')
      })

      expect(result.current.currentGalleryId).toBe('gallery-2')
    })
  })

  describe('deleteGallery', () => {
    it('throws error when trying to delete the only gallery', async () => {
      const { result } = renderHook(() => useGalleries())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockDocs = [
        { id: 'gallery-1', data: () => ({ name: 'Default', createdAt: { toMillis: () => 1000 } }) },
      ]

      act(() => {
        snapshotCallback({ docs: mockDocs })
      })

      await expect(
        act(async () => {
          await result.current.deleteGallery('gallery-1')
        })
      ).rejects.toThrow('Cannot delete the only gallery')
    })

    it('deletes gallery and switches to another', async () => {
      const mockBatch = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(),
      }
      writeBatch.mockReturnValue(mockBatch)
      getDocs.mockResolvedValue({ docs: [] })
      doc.mockReturnValue({})

      const { result } = renderHook(() => useGalleries())

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockDocs = [
        { id: 'gallery-1', data: () => ({ name: 'Default', createdAt: { toMillis: () => 1000 } }) },
        { id: 'gallery-2', data: () => ({ name: 'Front', createdAt: { toMillis: () => 2000 } }) },
      ]

      act(() => {
        snapshotCallback({ docs: mockDocs })
      })

      // Select gallery-1 first
      act(() => {
        result.current.selectGallery('gallery-1')
      })

      await act(async () => {
        await result.current.deleteGallery('gallery-1')
      })

      expect(mockBatch.commit).toHaveBeenCalled()
      // Should switch to gallery-2
      expect(result.current.currentGalleryId).toBe('gallery-2')
    })
  })
})
