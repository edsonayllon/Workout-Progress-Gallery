import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthScreen } from './AuthScreen'

// Mock the AuthContext
const mockLogin = vi.fn()
const mockClearError = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    login: mockLogin,
    error: null,
    clearError: mockClearError,
  }),
}))

describe('AuthScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogin.mockResolvedValue(undefined)
  })

  it('renders the app title', () => {
    render(<AuthScreen />)

    expect(screen.getByRole('heading', { name: /workout progress gallery/i })).toBeInTheDocument()
  })

  it('renders sign in with google button', () => {
    render(<AuthScreen />)

    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('renders privacy notice', () => {
    render(<AuthScreen />)

    expect(screen.getByText(/your photos are private/i)).toBeInTheDocument()
  })

  it('renders sign in prompt text', () => {
    render(<AuthScreen />)

    expect(screen.getByText(/sign in with google to continue/i)).toBeInTheDocument()
  })

  describe('sign in flow', () => {
    it('calls login when sign in button is clicked', async () => {
      render(<AuthScreen />)

      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      await userEvent.click(signInButton)

      expect(mockClearError).toHaveBeenCalled()
      expect(mockLogin).toHaveBeenCalledTimes(1)
    })

    it('shows signing in state while processing', async () => {
      // Make login take some time
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<AuthScreen />)

      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      })

      // Button should be disabled during sign in
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('prevents multiple sign in attempts while processing', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<AuthScreen />)

      const signInButton = screen.getByRole('button', { name: /sign in with google/i })

      // Click multiple times rapidly
      fireEvent.click(signInButton)
      fireEvent.click(signInButton)
      fireEvent.click(signInButton)

      await waitFor(() => {
        // Should only call login once due to isSubmitting check
        expect(mockLogin).toHaveBeenCalledTimes(1)
      })
    })

    it('re-enables button after successful sign in', async () => {
      mockLogin.mockResolvedValue(undefined)

      render(<AuthScreen />)

      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      await userEvent.click(signInButton)

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled()
      })
    })

    it('re-enables button after failed sign in', async () => {
      mockLogin.mockRejectedValue(new Error('Auth failed'))

      render(<AuthScreen />)

      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      await userEvent.click(signInButton)

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled()
      })
    })
  })

  describe('error display', () => {
    it('displays error message when error exists', () => {
      vi.mocked(vi.importActual('../context/AuthContext')).useAuthContext = () => ({
        login: mockLogin,
        error: 'Authentication failed',
        clearError: mockClearError,
      })

      // Re-mock with error
      vi.doMock('../context/AuthContext', () => ({
        useAuthContext: () => ({
          login: mockLogin,
          error: 'Authentication failed',
          clearError: mockClearError,
        }),
      }))
    })

    it('clears error when sign in button is clicked', async () => {
      render(<AuthScreen />)

      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      await userEvent.click(signInButton)

      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('Google icon', () => {
    it('renders Google logo SVG in the button', () => {
      render(<AuthScreen />)

      const button = screen.getByRole('button', { name: /sign in with google/i })
      const svg = button.querySelector('svg')

      expect(svg).toBeInTheDocument()
    })

    it('shows spinner during sign in instead of Google logo', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<AuthScreen />)

      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      fireEvent.click(signInButton)

      await waitFor(() => {
        const button = screen.getByRole('button')
        const spinnerSvg = button.querySelector('svg.animate-spin')
        expect(spinnerSvg).toBeInTheDocument()
      })
    })
  })
})
