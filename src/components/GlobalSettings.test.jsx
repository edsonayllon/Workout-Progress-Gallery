import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GlobalSettings } from './GlobalSettings'

describe('GlobalSettings', () => {
  const mockConfig = {
    unitSystem: 'imperial',
    measurements: ['Waist', 'Chest'],
    ratios: [],
    sortOrder: 'chronological',
  }

  let mockOnUpdate
  let mockOnClose

  beforeEach(() => {
    mockOnUpdate = vi.fn().mockResolvedValue()
    mockOnClose = vi.fn()
  })

  it('renders modal with title', () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    expect(screen.getByText('Default Settings')).toBeInTheDocument()
    expect(screen.getByText(/applied to all galleries/i)).toBeInTheDocument()
  })

  it('displays current unit system', () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    const imperialButton = screen.getByRole('button', { name: /imperial/i })
    expect(imperialButton).toHaveClass('bg-blue-500')
  })

  it('allows switching to metric', () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    const metricButton = screen.getByRole('button', { name: /metric/i })
    fireEvent.click(metricButton)

    expect(metricButton).toHaveClass('bg-blue-500')
  })

  it('displays existing measurements', () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    expect(screen.getByText('Waist')).toBeInTheDocument()
    expect(screen.getByText('Chest')).toBeInTheDocument()
  })

  it('allows adding new measurement', () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    const input = screen.getByPlaceholderText(/add measurement/i)
    fireEvent.change(input, { target: { value: 'Arms' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Arms')).toBeInTheDocument()
  })

  it('allows adding measurement with Enter key', () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    const input = screen.getByPlaceholderText(/add measurement/i)
    fireEvent.change(input, { target: { value: 'Hips' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('Hips')).toBeInTheDocument()
  })

  it('prevents adding duplicate measurement', () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    const input = screen.getByPlaceholderText(/add measurement/i)
    fireEvent.change(input, { target: { value: 'Waist' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    // Should still only have one Waist
    expect(screen.getAllByText('Waist')).toHaveLength(1)
  })

  it('allows removing measurement', () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    const removeButtons = screen.getAllByTitle('Remove')
    fireEvent.click(removeButtons[0])

    expect(screen.queryByText('Waist')).not.toBeInTheDocument()
  })

  it('closes modal when cancel clicked', () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes modal when X button clicked', () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    const closeButtons = screen.getAllByRole('button')
    const xButton = closeButtons.find(btn => btn.querySelector('svg path[d*="M6 18L18 6"]'))
    fireEvent.click(xButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('saves settings and closes on save', async () => {
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    fireEvent.click(screen.getByRole('button', { name: /save settings/i }))

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({
        unitSystem: 'imperial',
        measurements: ['Waist', 'Chest'],
        ratios: [],
        sortOrder: 'chronological',
      })
    })

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows saving state while saving', async () => {
    mockOnUpdate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    fireEvent.click(screen.getByRole('button', { name: /save settings/i }))

    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('shows alert on save failure', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    mockOnUpdate.mockRejectedValue(new Error('Save failed'))

    render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    fireEvent.click(screen.getByRole('button', { name: /save settings/i }))

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Failed to save settings')
    })

    alertMock.mockRestore()
  })

  it('shows no measurements message when empty', () => {
    const emptyConfig = { ...mockConfig, measurements: [] }
    render(<GlobalSettings config={emptyConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    expect(screen.getByText(/no measurements defined/i)).toBeInTheDocument()
  })

  it('includes RatioEditor component', () => {
    const configWithMeasurements = {
      ...mockConfig,
      measurements: ['Shoulders', 'Waist'],
    }
    render(<GlobalSettings config={configWithMeasurements} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

    expect(screen.getByText('Measurement Ratios')).toBeInTheDocument()
  })

  describe('sort order', () => {
    it('displays photo order section', () => {
      render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

      expect(screen.getByText('Photo Order')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /oldest first/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /newest first/i })).toBeInTheDocument()
    })

    it('shows chronological as selected by default', () => {
      render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

      const oldestFirstBtn = screen.getByRole('button', { name: /oldest first/i })
      expect(oldestFirstBtn).toHaveClass('bg-blue-500')
    })

    it('allows switching to reverse chronological', () => {
      render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

      const newestFirstBtn = screen.getByRole('button', { name: /newest first/i })
      fireEvent.click(newestFirstBtn)

      expect(newestFirstBtn).toHaveClass('bg-blue-500')
    })

    it('saves sortOrder when saving', async () => {
      render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

      // Switch to newest first
      fireEvent.click(screen.getByRole('button', { name: /newest first/i }))

      fireEvent.click(screen.getByRole('button', { name: /save settings/i }))

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
          sortOrder: 'reverseChronological',
        }))
      })
    })

    it('shows helper text for chronological', () => {
      render(<GlobalSettings config={mockConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

      expect(screen.getByText(/shows "x days later"/i)).toBeInTheDocument()
    })

    it('shows helper text for reverse chronological', () => {
      const reverseConfig = { ...mockConfig, sortOrder: 'reverseChronological' }
      render(<GlobalSettings config={reverseConfig} onUpdate={mockOnUpdate} onClose={mockOnClose} />)

      expect(screen.getByText(/shows "x days before"/i)).toBeInTheDocument()
    })
  })
})
