import { useState, useEffect, useCallback } from 'react'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import { authApi } from '../api/client'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check current auth status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setIsLoading(true)
      const { user } = await authApi.getCurrentUser()
      setUser(user)
    } catch (err) {
      console.error('Auth check failed:', err)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const register = useCallback(async () => {
    setError(null)
    try {
      // Get registration options from server (no username needed)
      const { options, challengeId, userId } = await authApi.getRegistrationOptions()
      console.log('Registration options:', options)

      // Start WebAuthn registration (triggers passkey creation)
      const response = await startRegistration(options)
      console.log('Registration response:', response)

      // Verify registration with server
      const result = await authApi.verifyRegistration({
        challengeId,
        userId,
        response,
      })

      setUser(result.user)
      return result
    } catch (err) {
      console.error('Registration error:', err)
      const message = err.name === 'NotAllowedError'
        ? 'Passkey creation was cancelled'
        : err.message || 'Registration failed'
      setError(message)
      throw new Error(message)
    }
  }, [])

  const login = useCallback(async () => {
    setError(null)
    try {
      // Get authentication options from server (no username needed)
      const { options, challengeId } = await authApi.getLoginOptions()
      console.log('Login options:', options)

      // Start WebAuthn authentication (triggers passkey prompt)
      const response = await startAuthentication(options)
      console.log('Login response:', response)

      // Verify authentication with server
      const result = await authApi.verifyLogin({
        challengeId,
        response,
      })

      setUser(result.user)
      return result
    } catch (err) {
      console.error('Login error:', err)
      const message = err.name === 'NotAllowedError'
        ? 'Passkey authentication was cancelled'
        : err.message || 'Login failed'
      setError(message)
      throw new Error(message)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
      setUser(null)
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }, [])

  const updateUsername = useCallback(async (username) => {
    try {
      const { user: updatedUser } = await authApi.updateUser({ username })
      setUser(updatedUser)
      return updatedUser
    } catch (err) {
      throw new Error(err.message || 'Failed to update username')
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    register,
    login,
    logout,
    updateUsername,
    clearError,
  }
}
