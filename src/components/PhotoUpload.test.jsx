import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoUpload } from './PhotoUpload'

// Mock heic-decode
vi.mock('heic-decode', () => ({
  default: vi.fn(() => Promise.resolve({
    width: 100,
    height: 100,
    data: new Uint8Array(100 * 100 * 4),
  })),
}))

// Mock exifr
vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(() => Promise.resolve({
      DateTimeOriginal: new Date('2024-06-15'),
    })),
  },
}))

describe('PhotoUpload', () => {
  let mockOnUpload

  beforeEach(() => {
    mockOnUpload = vi.fn(() => Promise.resolve())
    vi.clearAllMocks()
  })

  it('renders the add photo button', () => {
    render(<PhotoUpload onUpload={mockOnUpload} />)

    expect(screen.getByRole('button', { name: /add photo/i })).toBeInTheDocument()
  })

  it('has a hidden file input', () => {
    render(<PhotoUpload onUpload={mockOnUpload} />)

    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveClass('hidden')
  })

  it('accepts image files and HEIC/HEIF', () => {
    render(<PhotoUpload onUpload={mockOnUpload} />)

    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toHaveAttribute('accept', 'image/*,.heic,.heif')
  })

  it('triggers file input click when button is clicked', async () => {
    render(<PhotoUpload onUpload={mockOnUpload} />)

    const fileInput = document.querySelector('input[type="file"]')
    const clickSpy = vi.spyOn(fileInput, 'click')

    const button = screen.getByRole('button', { name: /add photo/i })
    await userEvent.click(button)

    expect(clickSpy).toHaveBeenCalled()
  })

  it('calls onUpload with file and date when a JPEG is selected', async () => {
    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')

    await waitFor(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(
        expect.any(File),
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      )
    })
  })

  it('rejects non-image files with an alert', async () => {
    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'document.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]')

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(globalThis.alert).toHaveBeenCalledWith('Please select an image file')
    })
    expect(mockOnUpload).not.toHaveBeenCalled()
  })

  it('shows error alert when upload fails', async () => {
    const uploadError = new Error('Network error')
    mockOnUpload.mockRejectedValueOnce(uploadError)

    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(globalThis.alert).toHaveBeenCalledWith('Failed to upload photo: Network error')
    })
  })

  it('does nothing when no file is selected', async () => {
    render(<PhotoUpload onUpload={mockOnUpload} />)

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [] } })

    expect(mockOnUpload).not.toHaveBeenCalled()
  })

  it('resets file input after upload', async () => {
    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled()
    })

    expect(fileInput.value).toBe('')
  })

  it('uses file lastModified date as fallback when EXIF fails', async () => {
    const exifr = await import('exifr')
    exifr.default.parse.mockRejectedValueOnce(new Error('EXIF parse failed'))

    render(<PhotoUpload onUpload={mockOnUpload} />)

    const lastModified = new Date('2024-03-20').getTime()
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg', lastModified })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(
        expect.any(File),
        '2024-03-20'
      )
    })
  })

  it('handles PNG files correctly', async () => {
    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'image.png', { type: 'image/png' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled()
    })

    const [uploadedFile] = mockOnUpload.mock.calls[0]
    expect(uploadedFile.name).toBe('image.png')
  })

  it('detects HEIC files by extension even without proper MIME type', async () => {
    // Suppress expected console errors from HEIC conversion in jsdom
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(<PhotoUpload onUpload={mockOnUpload} />)

    // HEIC files often have empty or incorrect MIME type
    const file = new File(['test'], 'photo.HEIC', { type: '' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled()
    })

    // The file should be recognized as HEIC by extension and onUpload should be called
    // In jsdom, ImageData is not available so it falls back to original file
    const [uploadedFile] = mockOnUpload.mock.calls[0]
    // Either converted to .jpg or fallback to original .HEIC
    expect(uploadedFile.name).toMatch(/photo\.(jpg|HEIC)/)

    consoleSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it('falls back to original HEIC file if conversion fails', async () => {
    const heicDecode = await import('heic-decode')
    heicDecode.default.mockRejectedValueOnce(new Error('Decode failed'))

    // Suppress expected console error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'photo.heic', { type: 'image/heic' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled()
    })

    // Should fall back to original file
    const [uploadedFile] = mockOnUpload.mock.calls[0]
    expect(uploadedFile.name).toBe('photo.heic')

    consoleSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it('disables button while converting', async () => {
    // Make the conversion take some time
    const heicDecode = await import('heic-decode')
    heicDecode.default.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        width: 100,
        height: 100,
        data: new Uint8Array(100 * 100 * 4),
      }), 100))
    )

    // Mock canvas for HEIC conversion using a different approach
    const originalCreateElement = document.createElement.bind(document)
    document.createElement = vi.fn((tag) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({
            putImageData: vi.fn(),
          }),
          toBlob: (callback) => callback(new Blob(['converted'], { type: 'image/jpeg' })),
        }
      }
      return originalCreateElement(tag)
    })

    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'photo.heic', { type: 'image/heic' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Button should show converting state
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('Converting...')
      expect(screen.getByRole('button')).toBeDisabled()
    })

    // Wait for conversion to complete
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('+ Add Photo')
      expect(screen.getByRole('button')).not.toBeDisabled()
    })

    document.createElement = originalCreateElement
  })
})
