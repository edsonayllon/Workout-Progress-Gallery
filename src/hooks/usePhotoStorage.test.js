import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePhotoStorage } from './usePhotoStorage'

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
}))

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}))

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}))

vi.mock('../firebase', () => ({
  db: {},
  storage: {},
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
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

describe('usePhotoStorage', () => {
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

    // Setup query mocks
    query.mockReturnValue({})
    collection.mockReturnValue({})
    where.mockReturnValue({})
  })

  describe('initial state', () => {
    it('starts with empty photos array', () => {
      const { result } = renderHook(() => usePhotoStorage('gallery-1'))

      expect(result.current.photos).toEqual([])
      expect(result.current.isLoaded).toBe(true) // No user yet
    })

    it('requires galleryId to fetch photos', () => {
      const { result } = renderHook(() => usePhotoStorage(null))

      expect(result.current.photos).toEqual([])
      expect(result.current.isLoaded).toBe(true)
    })
  })

  describe('with authenticated user and gallery', () => {
    it('subscribes to photos when user is authenticated', () => {
      renderHook(() => usePhotoStorage('gallery-1'))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      expect(onSnapshot).toHaveBeenCalled()
    })

    it('sets photos from snapshot', () => {
      const { result } = renderHook(() => usePhotoStorage('gallery-1'))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockDocs = [
        {
          id: 'photo-1',
          data: () => ({
            imageUrl: 'https://example.com/photo1.jpg',
            date: '2024-01-01',
            weight: 150,
          }),
        },
        {
          id: 'photo-2',
          data: () => ({
            imageUrl: 'https://example.com/photo2.jpg',
            date: '2024-01-15',
            weight: 148,
          }),
        },
      ]

      act(() => {
        snapshotCallback({ docs: mockDocs })
      })

      expect(result.current.photos).toHaveLength(2)
      expect(result.current.photos[0].id).toBe('photo-1')
      expect(result.current.photos[1].id).toBe('photo-2')
    })

    it('sorts photos by date', () => {
      const { result } = renderHook(() => usePhotoStorage('gallery-1'))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockDocs = [
        { id: 'photo-2', data: () => ({ date: '2024-02-01' }) },
        { id: 'photo-1', data: () => ({ date: '2024-01-01' }) },
        { id: 'photo-3', data: () => ({ date: '2024-03-01' }) },
      ]

      act(() => {
        snapshotCallback({ docs: mockDocs })
      })

      expect(result.current.photos[0].date).toBe('2024-01-01')
      expect(result.current.photos[1].date).toBe('2024-02-01')
      expect(result.current.photos[2].date).toBe('2024-03-01')
    })

    it('resets photos when gallery changes', () => {
      const { result, rerender } = renderHook(
        ({ galleryId }) => usePhotoStorage(galleryId),
        { initialProps: { galleryId: 'gallery-1' } }
      )

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockDocs = [{ id: 'photo-1', data: () => ({ date: '2024-01-01' }) }]

      act(() => {
        snapshotCallback({ docs: mockDocs })
      })

      expect(result.current.photos).toHaveLength(1)

      // Change gallery
      rerender({ galleryId: 'gallery-2' })

      expect(result.current.photos).toEqual([])
    })

    it('handles snapshot errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => usePhotoStorage('gallery-1'))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      act(() => {
        snapshotErrorCallback(new Error('Firestore error'))
      })

      expect(result.current.isLoaded).toBe(true)
      expect(result.current.photos).toEqual([])
      consoleSpy.mockRestore()
    })
  })

  describe('addPhoto', () => {
    beforeEach(() => {
      ref.mockReturnValue({})
      uploadBytes.mockResolvedValue({})
      getDownloadURL.mockResolvedValue('https://storage.example.com/photo.jpg')
      addDoc.mockResolvedValue({ id: 'new-photo-id' })
    })

    it('uploads photo and creates document', async () => {
      const { result } = renderHook(() => usePhotoStorage('gallery-1'))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        const id = await result.current.addPhoto(mockFile, '2024-01-15')
        expect(id).toBe('new-photo-id')
      })

      expect(uploadBytes).toHaveBeenCalled()
      expect(getDownloadURL).toHaveBeenCalled()
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'test-user-123',
          galleryId: 'gallery-1',
          date: '2024-01-15',
          imageUrl: 'https://storage.example.com/photo.jpg',
        })
      )
    })

    it('uses current date when date not provided', async () => {
      const { result } = renderHook(() => usePhotoStorage('gallery-1'))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.addPhoto(mockFile)
      })

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      )
    })

    it('throws error when no gallery selected', async () => {
      const { result } = renderHook(() => usePhotoStorage(null))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await expect(
        act(async () => {
          await result.current.addPhoto(mockFile)
        })
      ).rejects.toThrow('No gallery selected')
    })
  })

  describe('updatePhoto', () => {
    it('updates photo document', async () => {
      updateDoc.mockResolvedValue()
      doc.mockReturnValue({})

      const { result } = renderHook(() => usePhotoStorage('gallery-1'))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      await act(async () => {
        await result.current.updatePhoto('photo-1', { weight: 155 })
      })

      expect(updateDoc).toHaveBeenCalledWith({}, { weight: 155 })
    })
  })

  describe('deletePhoto', () => {
    beforeEach(() => {
      deleteDoc.mockResolvedValue()
      deleteObject.mockResolvedValue()
      doc.mockReturnValue({})
      ref.mockReturnValue({})
    })

    it('deletes photo from storage and firestore', async () => {
      const { result } = renderHook(() => usePhotoStorage('gallery-1'))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      // Add a photo to the list
      const mockDocs = [
        {
          id: 'photo-1',
          data: () => ({
            imageUrl: 'https://example.com/photo1.jpg',
            storagePath: 'photos/user/photo1.jpg',
            date: '2024-01-01',
          }),
        },
      ]

      act(() => {
        snapshotCallback({ docs: mockDocs })
      })

      await act(async () => {
        await result.current.deletePhoto('photo-1')
      })

      expect(deleteObject).toHaveBeenCalled()
      expect(deleteDoc).toHaveBeenCalled()
    })

    it('handles storage deletion errors gracefully', async () => {
      deleteObject.mockRejectedValue({ code: 'storage/object-not-found' })

      const { result } = renderHook(() => usePhotoStorage('gallery-1'))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      const mockDocs = [
        {
          id: 'photo-1',
          data: () => ({
            storagePath: 'photos/user/photo1.jpg',
            date: '2024-01-01',
          }),
        },
      ]

      act(() => {
        snapshotCallback({ docs: mockDocs })
      })

      // Should not throw
      await act(async () => {
        await result.current.deletePhoto('photo-1')
      })

      expect(deleteDoc).toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('unsubscribes from snapshot on unmount', () => {
      const unsubscribe = vi.fn()
      onSnapshot.mockReturnValue(unsubscribe)

      const { unmount } = renderHook(() => usePhotoStorage('gallery-1'))

      act(() => {
        authCallback({ uid: 'test-user-123' })
      })

      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })
  })
})
