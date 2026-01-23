import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GallerySelector } from './GallerySelector'

describe('GallerySelector', () => {
  const mockGalleries = [
    { id: '1', name: 'Default' },
    { id: '2', name: 'Front Photos' },
    { id: '3', name: 'Side Photos' },
  ]

  const mockCurrentGallery = mockGalleries[0]

  let mockOnSelect
  let mockOnCreate
  let mockOnRename
  let mockOnDelete

  beforeEach(() => {
    mockOnSelect = vi.fn()
    mockOnCreate = vi.fn().mockResolvedValue('new-id')
    mockOnRename = vi.fn().mockResolvedValue(undefined)
    mockOnDelete = vi.fn().mockResolvedValue(undefined)
  })

  const renderSelector = (props = {}) => {
    return render(
      <GallerySelector
        galleries={mockGalleries}
        currentGallery={mockCurrentGallery}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        {...props}
      />
    )
  }

  describe('initial render', () => {
    it('displays current gallery name', () => {
      renderSelector()

      expect(screen.getByText('Default')).toBeInTheDocument()
    })

    it('shows "Select Gallery" when no current gallery', () => {
      renderSelector({ currentGallery: null })

      expect(screen.getByText('Select Gallery')).toBeInTheDocument()
    })

    it('dropdown is closed initially', () => {
      renderSelector()

      expect(screen.queryByText('Galleries')).not.toBeInTheDocument()
    })
  })

  describe('dropdown behavior', () => {
    it('opens dropdown when button is clicked', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))

      expect(screen.getByText('Galleries')).toBeInTheDocument()
    })

    it('displays all galleries in dropdown', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))

      expect(screen.getByText('Front Photos')).toBeInTheDocument()
      expect(screen.getByText('Side Photos')).toBeInTheDocument()
    })

    it('closes dropdown when clicking outside', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))
      expect(screen.getByText('Galleries')).toBeInTheDocument()

      fireEvent.mouseDown(document.body)

      expect(screen.queryByText('Galleries')).not.toBeInTheDocument()
    })

    it('closes dropdown after selecting a gallery', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))
      fireEvent.click(screen.getByText('Front Photos'))

      expect(screen.queryByText('Galleries')).not.toBeInTheDocument()
    })
  })

  describe('selecting galleries', () => {
    it('calls onSelect when a gallery is clicked', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))
      fireEvent.click(screen.getByText('Front Photos'))

      expect(mockOnSelect).toHaveBeenCalledWith('2')
    })
  })

  describe('creating galleries', () => {
    it('shows create form when "New Gallery" is clicked', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))
      fireEvent.click(screen.getByText('New Gallery'))

      expect(screen.getByPlaceholderText('New gallery name')).toBeInTheDocument()
    })

    it('calls onCreate with new gallery name', async () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))
      fireEvent.click(screen.getByText('New Gallery'))

      const input = screen.getByPlaceholderText('New gallery name')
      fireEvent.change(input, { target: { value: 'Back Photos' } })
      fireEvent.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith('Back Photos')
      })
    })

    it('does not call onCreate with empty name', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))
      fireEvent.click(screen.getByText('New Gallery'))

      fireEvent.click(screen.getByRole('button', { name: /create/i }))

      expect(mockOnCreate).not.toHaveBeenCalled()
    })

    it('hides create form when cancel is clicked', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))
      fireEvent.click(screen.getByText('New Gallery'))

      expect(screen.getByPlaceholderText('New gallery name')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.queryByPlaceholderText('New gallery name')).not.toBeInTheDocument()
    })
  })

  describe('renaming galleries', () => {
    it('shows rename form when edit button is clicked', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))

      const renameButtons = screen.getAllByTitle('Rename')
      fireEvent.click(renameButtons[0])

      expect(screen.getByDisplayValue('Default')).toBeInTheDocument()
    })

    it('calls onRename with new name', async () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))

      const renameButtons = screen.getAllByTitle('Rename')
      fireEvent.click(renameButtons[0])

      const input = screen.getByDisplayValue('Default')
      fireEvent.change(input, { target: { value: 'Main Gallery' } })
      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(mockOnRename).toHaveBeenCalledWith('1', 'Main Gallery')
      })
    })
  })

  describe('deleting galleries', () => {
    beforeEach(() => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('shows delete button for galleries when more than one exists', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))

      const deleteButtons = screen.getAllByTitle('Delete')
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it('does not show delete button when only one gallery exists', () => {
      renderSelector({ galleries: [mockGalleries[0]] })

      fireEvent.click(screen.getByRole('button', { name: /default/i }))

      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument()
    })

    it('calls onDelete after confirmation', async () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))

      const deleteButtons = screen.getAllByTitle('Delete')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('1')
      })
    })

    it('does not call onDelete when confirmation is cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))

      const deleteButtons = screen.getAllByTitle('Delete')
      fireEvent.click(deleteButtons[0])

      expect(mockOnDelete).not.toHaveBeenCalled()
    })
  })

  describe('current gallery indicator', () => {
    it('shows indicator for current gallery', () => {
      renderSelector()

      fireEvent.click(screen.getByRole('button', { name: /default/i }))

      // The current gallery row should have the green background
      const galleryItems = screen.getAllByRole('button').filter(
        btn => btn.textContent.includes('Default') && btn.closest('.bg-green-50')
      )
      expect(galleryItems.length).toBeGreaterThan(0)
    })
  })
})
