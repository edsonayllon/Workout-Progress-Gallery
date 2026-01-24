import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GallerySettings } from './GallerySettings'

describe('GallerySettings', () => {
  const mockGlobalConfig = {
    unitSystem: 'imperial',
    measurements: ['Waist', 'Chest', 'Arms'],
    ratios: [],
  }

  const mockGallery = {
    id: 'gallery-1',
    name: 'My Gallery',
    config: null,
  }

  const mockGalleryWithOverride = {
    id: 'gallery-2',
    name: 'Custom Gallery',
    config: {
      unitSystem: 'metric',
      measurements: ['Waist', 'Hips'],
      ratios: [{ name: 'Waist-to-Hips', numerator: 'Waist', denominator: 'Hips' }],
    },
  }

  let mockOnUpdate
  let mockOnClear
  let mockOnRename
  let mockOnDelete
  let mockOnClose

  beforeEach(() => {
    mockOnUpdate = vi.fn().mockResolvedValue()
    mockOnClear = vi.fn().mockResolvedValue()
    mockOnRename = vi.fn().mockResolvedValue()
    mockOnDelete = vi.fn().mockResolvedValue()
    mockOnClose = vi.fn()
  })

  describe('without config override', () => {
    it('shows "Using default settings" message', () => {
      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Using default settings')).toBeInTheDocument()
    })

    it('uses global config values', () => {
      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Waist')).toBeInTheDocument()
      expect(screen.getByText('Chest')).toBeInTheDocument()
      expect(screen.getByText('Arms')).toBeInTheDocument()
    })

    it('does not show reset button', () => {
      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText(/reset to default/i)).not.toBeInTheDocument()
    })
  })

  describe('with config override', () => {
    it('shows custom settings message', () => {
      render(
        <GallerySettings
          gallery={mockGalleryWithOverride}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Custom settings for this gallery')).toBeInTheDocument()
    })

    it('uses gallery config values', () => {
      render(
        <GallerySettings
          gallery={mockGalleryWithOverride}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Waist')).toBeInTheDocument()
      expect(screen.getByText('Hips')).toBeInTheDocument()
      expect(screen.queryByText('Chest')).not.toBeInTheDocument()
    })

    it('shows reset button', () => {
      render(
        <GallerySettings
          gallery={mockGalleryWithOverride}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/reset to default settings/i)).toBeInTheDocument()
    })

    it('calls onClear when reset clicked', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(
        <GallerySettings
          gallery={mockGalleryWithOverride}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText(/reset to default settings/i))

      await waitFor(() => {
        expect(mockOnClear).toHaveBeenCalledWith('gallery-2')
      })
    })
  })

  describe('gallery name', () => {
    it('displays current gallery name', () => {
      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByDisplayValue('My Gallery')).toBeInTheDocument()
    })

    it('renames gallery on save when name changed', async () => {
      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      const nameInput = screen.getByDisplayValue('My Gallery')
      fireEvent.change(nameInput, { target: { value: 'Renamed Gallery' } })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(mockOnRename).toHaveBeenCalledWith('gallery-1', 'Renamed Gallery')
      })
    })
  })

  describe('delete gallery', () => {
    it('shows delete button when more than 1 gallery', () => {
      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Delete Gallery')).toBeInTheDocument()
    })

    it('hides delete button when only 1 gallery', () => {
      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={1}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Delete Gallery')).not.toBeInTheDocument()
    })

    it('calls onDelete when confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('Delete Gallery'))

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('gallery-1')
      })
    })

    it('does not delete when not confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('Delete Gallery'))

      expect(mockOnDelete).not.toHaveBeenCalled()
    })
  })

  describe('save functionality', () => {
    it('saves config changes', async () => {
      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      // Switch to metric
      fireEvent.click(screen.getByRole('button', { name: /metric/i }))

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith('gallery-1', expect.objectContaining({
          unitSystem: 'metric',
        }))
      })
    })

    it('shows saving state', async () => {
      mockOnUpdate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })

  describe('modal controls', () => {
    it('closes on cancel', () => {
      render(
        <GallerySettings
          gallery={mockGallery}
          globalConfig={mockGlobalConfig}
          galleryCount={2}
          onUpdate={mockOnUpdate}
          onClear={mockOnClear}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
