import { useState } from 'react'
import { useAuthContext } from '../context/AuthContext'

export function AuthScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, login, error, clearError } = useAuthContext()

  const handleSignIn = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    clearError()

    try {
      await login()
    } catch (err) {
      // Error is already set in useAuth
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateAccount = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    clearError()

    try {
      await register()
    } catch (err) {
      // Error is already set in useAuth
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              Workout Progress Gallery
            </h1>
            <p className="text-gray-500">
              Sign in with your passkey to continue
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Waiting for passkey...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  <span>Sign In with Passkey</span>
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={handleCreateAccount}
              disabled={isSubmitting}
              className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium transition-colors"
            >
              Create New Account
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              Passkeys are secure, phishing-resistant credentials stored on your device.
              {' '}
              <a
                href="https://passkeys.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
