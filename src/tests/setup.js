import '@testing-library/jest-dom'

// Mock window.alert
globalThis.alert = vi.fn()

// Mock URL.createObjectURL
globalThis.URL.createObjectURL = vi.fn(() => 'mock-url')
globalThis.URL.revokeObjectURL = vi.fn()
