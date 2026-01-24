import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuthContext } from './AuthContext'

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'test-user', email: 'test@example.com' },
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })),
}))

describe('AuthContext', () => {
  describe('AuthProvider', () => {
    it('provides auth context to children', () => {
      const TestConsumer = () => {
        const auth = useAuthContext()
        return <div data-testid="user-email">{auth.user?.email}</div>
      }

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })

    it('renders children', () => {
      render(
        <AuthProvider>
          <div data-testid="child">Child content</div>
        </AuthProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })

  describe('useAuthContext', () => {
    it('throws error when used outside AuthProvider', () => {
      const TestComponent = () => {
        useAuthContext()
        return null
      }

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => render(<TestComponent />)).toThrow(
        'useAuthContext must be used within an AuthProvider'
      )

      consoleSpy.mockRestore()
    })

    it('returns auth values from useAuth', () => {
      const TestConsumer = () => {
        const auth = useAuthContext()
        return (
          <div>
            <span data-testid="uid">{auth.user?.uid}</span>
            <span data-testid="loading">{auth.isLoading.toString()}</span>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      expect(screen.getByTestId('uid')).toHaveTextContent('test-user')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })
})
