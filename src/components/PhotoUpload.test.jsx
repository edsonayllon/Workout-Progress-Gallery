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

// Mock image compression
vi.mock('../utils/imageCompression', () => ({
  compressImage: vi.fn((file) => Promise.resolve({
    file: new File([file], file.name, { type: file.type }),
    originalSize: 5000000,
    compressedSize: 500000,
    width: 1920,
    height: 1080,
    originalWidth: 3000,
    originalHeight: 2000,
  })),
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

  it('compresses and uploads JPEG with date', async () => {
    const { compressImage } = await import('../utils/imageCompression')

    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(compressImage).toHaveBeenCalledWith(file, {
        maxDimension: 1920,
        quality: 0.8,
      })
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
    const { compressImage } = await import('../utils/imageCompression')
    compressImage.mockResolvedValueOnce({
      file: new File(['compressed'], 'image.jpg', { type: 'image/jpeg' }),
      originalSize: 5000000,
      compressedSize: 500000,
      width: 1920,
      height: 1080,
      originalWidth: 3000,
      originalHeight: 2000,
    })

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

    // File gets compressed to JPEG
    const [uploadedFile] = mockOnUpload.mock.calls[0]
    expect(uploadedFile.name).toBe('image.jpg')
  })

  it('converts HEIC files before compression', async () => {
    const { compressImage } = await import('../utils/imageCompression')
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'photo.HEIC', { type: '' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled()
    })

    // compressImage should have been called (after HEIC conversion attempt)
    expect(compressImage).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('falls back to original HEIC file if conversion fails then compresses', async () => {
    const heicDecode = await import('heic-decode')
    heicDecode.default.mockRejectedValueOnce(new Error('Decode failed'))

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

    consoleSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it('shows processing status while working', async () => {
    const { compressImage } = await import('../utils/imageCompression')

    // Make compression take some time
    compressImage.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        file: new File(['compressed'], 'photo.jpg', { type: 'image/jpeg' }),
        originalSize: 5000000,
        compressedSize: 500000,
        width: 1920,
        height: 1080,
        originalWidth: 3000,
        originalHeight: 2000,
      }), 100))
    )

    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Button should be disabled during processing
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })

    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('+ Add Photo')
      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })

  it('shows error when compression fails', async () => {
    const { compressImage } = await import('../utils/imageCompression')
    compressImage.mockRejectedValueOnce(new Error('Compression failed'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<PhotoUpload onUpload={mockOnUpload} />)

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(8)),
    })

    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(globalThis.alert).toHaveBeenCalledWith('Failed to upload photo: Compression failed')
    })

    expect(mockOnUpload).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
