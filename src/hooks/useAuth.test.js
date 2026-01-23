import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

// Mock Firebase
vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('../firebase', () => ({
  auth: {},
  googleProvider: {},
}))

import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

describe('useAuth', () => {
  let authStateCallback

  beforeEach(() => {
    vi.clearAllMocks()
    authStateCallback = null

    // Setup onAuthStateChanged mock to capture the callback
    onAuthStateChanged.mockImplementation((auth, callback) => {
      authStateCallback = callback
      return vi.fn() // Return unsubscribe function
    })
  })

  describe('initial state', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('subscribes to auth state changes on mount', () => {
      renderHook(() => useAuth())

      expect(onAuthStateChanged).toHaveBeenCalledTimes(1)
    })
  })

  describe('auth state changes', () => {
    it('sets user when authenticated', async () => {
      const { result } = renderHook(() => useAuth())

      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      }

      act(() => {
        authStateCallback(mockUser)
      })

      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      })
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('clears user when logged out', async () => {
      const { result } = renderHook(() => useAuth())

      // First login
      act(() => {
        authStateCallback({ uid: 'user-123', email: 'test@example.com' })
      })

      expect(result.current.isAuthenticated).toBe(true)

      // Then logout
      act(() => {
        authStateCallback(null)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('login', () => {
    it('calls signInWithPopup', async () => {
      signInWithPopup.mockResolvedValue({})
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login()
      })

      expect(signInWithPopup).toHaveBeenCalledTimes(1)
    })

    it('clears error before login attempt', async () => {
      signInWithPopup.mockRejectedValueOnce(new Error('First error'))
      const { result } = renderHook(() => useAuth())

      // First failed login
      await act(async () => {
        try {
          await result.current.login()
        } catch (e) {}
      })

      expect(result.current.error).toBe('First error')

      // Second login attempt should clear error first
      signInWithPopup.mockResolvedValueOnce({})
      await act(async () => {
        await result.current.login()
      })

      expect(result.current.error).toBe(null)
    })

    it('sets error on login failure', async () => {
      signInWithPopup.mockRejectedValue(new Error('Login failed'))
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        try {
          await result.current.login()
        } catch (e) {}
      })

      expect(result.current.error).toBe('Login failed')
    })

    it('handles popup closed by user', async () => {
      signInWithPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user' })
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        try {
          await result.current.login()
        } catch (e) {}
      })

      expect(result.current.error).toBe('Sign-in was cancelled')
    })
  })

  describe('logout', () => {
    it('calls signOut', async () => {
      signOut.mockResolvedValue()
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.logout()
      })

      expect(signOut).toHaveBeenCalledTimes(1)
    })

    it('clears user on logout', async () => {
      signOut.mockResolvedValue()
      const { result } = renderHook(() => useAuth())

      // First set user
      act(() => {
        authStateCallback({ uid: 'user-123', email: 'test@example.com' })
      })

      expect(result.current.user).not.toBe(null)

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBe(null)
    })

    it('handles logout errors gracefully', async () => {
      signOut.mockRejectedValue(new Error('Logout failed'))
      const { result } = renderHook(() => useAuth())

      // Should not throw
      await act(async () => {
        await result.current.logout()
      })
    })
  })

  describe('clearError', () => {
    it('clears the error state', async () => {
      signInWithPopup.mockRejectedValue(new Error('Some error'))
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        try {
          await result.current.login()
        } catch (e) {}
      })

      expect(result.current.error).toBe('Some error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe('cleanup', () => {
    it('unsubscribes from auth state on unmount', () => {
      const unsubscribe = vi.fn()
      onAuthStateChanged.mockReturnValue(unsubscribe)

      const { unmount } = renderHook(() => useAuth())

      unmount()

      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
  })
})
