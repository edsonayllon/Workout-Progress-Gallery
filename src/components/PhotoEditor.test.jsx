import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoEditor } from './PhotoEditor'

describe('PhotoEditor', () => {
  const mockPhoto = {
    id: '1',
    date: '2024-06-15',
    weight: 175.5,
    measurements: [
      { label: 'Chest', value: 42 },
      { label: 'Waist', value: 32 },
    ],
  }

  const mockGalleryConfig = {
    unitSystem: 'imperial',
    measurements: ['Chest', 'Waist', 'Arms'],
    ratios: [],
  }

  let mockOnUpdate

  beforeEach(() => {
    mockOnUpdate = vi.fn()
  })

  describe('when no photo is provided', () => {
    it('renders nothing', () => {
      const { container } = render(<PhotoEditor photo={null} onUpdate={mockOnUpdate} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('when photo is provided', () => {
    it('renders the editor heading', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      expect(screen.getByText(/edit photo details/i)).toBeInTheDocument()
    })

    it('renders date input with correct value', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const dateInput = screen.getByLabelText(/date/i)
      expect(dateInput).toHaveValue('2024-06-15')
    })

    it('renders weight input with correct value', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const weightInput = screen.getByLabelText(/weight/i)
      expect(weightInput).toHaveValue(175.5)
    })

    it('renders weight input empty when weight is null', () => {
      const photoWithoutWeight = { ...mockPhoto, weight: null }
      render(<PhotoEditor photo={photoWithoutWeight} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const weightInput = screen.getByLabelText(/weight/i)
      expect(weightInput).toHaveValue(null)
    })

    it('renders measurements section', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      expect(screen.getByText(/measurements/i)).toBeInTheDocument()
    })

    it('renders all config measurements as labels', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      expect(screen.getByText('Chest')).toBeInTheDocument()
      expect(screen.getByText('Waist')).toBeInTheDocument()
      expect(screen.getByText('Arms')).toBeInTheDocument()
    })

    it('shows existing measurement values', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      expect(screen.getByDisplayValue('42')).toBeInTheDocument()
      expect(screen.getByDisplayValue('32')).toBeInTheDocument()
    })
  })

  describe('date editing', () => {
    it('calls onUpdate when date is changed', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const dateInput = screen.getByLabelText(/date/i)
      fireEvent.change(dateInput, { target: { value: '2024-07-01' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', { date: '2024-07-01' })
    })
  })

  describe('weight editing', () => {
    it('calls onUpdate when weight is changed', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const weightInput = screen.getByLabelText(/weight/i)
      fireEvent.change(weightInput, { target: { value: '180' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', { weight: 180 })
    })

    it('calls onUpdate with null when weight is cleared', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const weightInput = screen.getByLabelText(/weight/i)
      fireEvent.change(weightInput, { target: { value: '' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', { weight: null })
    })

    it('handles decimal weight values', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const weightInput = screen.getByLabelText(/weight/i)
      fireEvent.change(weightInput, { target: { value: '176.7' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', { weight: 176.7 })
    })
  })

  describe('measurement value editing', () => {
    it('calls onUpdate when measurement value is changed', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const valueInput = screen.getByDisplayValue('42')
      fireEvent.change(valueInput, { target: { value: '44' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: expect.arrayContaining([
          expect.objectContaining({ label: 'Chest', value: 44 }),
        ]),
      })
    })

    it('calls onUpdate with null when measurement value is cleared', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const valueInput = screen.getByDisplayValue('42')
      fireEvent.change(valueInput, { target: { value: '' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: expect.arrayContaining([
          expect.objectContaining({ label: 'Chest', value: null }),
        ]),
      })
    })

    it('handles decimal measurement values', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const valueInput = screen.getByDisplayValue('42')
      fireEvent.change(valueInput, { target: { value: '42.5' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: expect.arrayContaining([
          expect.objectContaining({ label: 'Chest', value: 42.5 }),
        ]),
      })
    })

    it('adds new measurement when value entered for previously empty label', async () => {
      const photoWithPartialMeasurements = {
        ...mockPhoto,
        measurements: [{ label: 'Chest', value: 42 }],
      }
      render(<PhotoEditor photo={photoWithPartialMeasurements} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      // Arms is in config but has no value - find its input
      const armsLabel = screen.getByText('Arms')
      const armsInput = armsLabel.closest('.flex').querySelector('input')
      fireEvent.change(armsInput, { target: { value: '15' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: expect.arrayContaining([
          expect.objectContaining({ label: 'Arms', value: 15 }),
        ]),
      })
    })
  })

  describe('unit system', () => {
    it('displays imperial units by default', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      expect(screen.getByText(/weight \(lbs\)/i)).toBeInTheDocument()
    })

    it('displays metric units when config specifies metric', () => {
      const metricConfig = { ...mockGalleryConfig, unitSystem: 'metric' }
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={metricConfig} />)

      expect(screen.getByText(/weight \(kg\)/i)).toBeInTheDocument()
      expect(screen.getByText(/measurements \(cm\)/i)).toBeInTheDocument()
    })

    it('displays imperial units when config specifies imperial', () => {
      const imperialConfig = { ...mockGalleryConfig, unitSystem: 'imperial' }
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={imperialConfig} />)

      expect(screen.getByText(/weight \(lbs\)/i)).toBeInTheDocument()
      expect(screen.getByText(/measurements \(in\)/i)).toBeInTheDocument()
    })
  })

  describe('no measurements configured', () => {
    it('shows message when no measurements in config', () => {
      const emptyMeasurementsConfig = { ...mockGalleryConfig, measurements: [] }
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={emptyMeasurementsConfig} />)

      expect(screen.getByText(/no measurements configured/i)).toBeInTheDocument()
    })

    it('suggests opening gallery settings', () => {
      const emptyMeasurementsConfig = { ...mockGalleryConfig, measurements: [] }
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={emptyMeasurementsConfig} />)

      expect(screen.getByText(/open gallery settings/i)).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles undefined measurements', () => {
      const photoWithUndefinedMeasurements = { ...mockPhoto, measurements: undefined }
      render(<PhotoEditor photo={photoWithUndefinedMeasurements} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      // Should render without crashing
      expect(screen.getByText(/edit photo details/i)).toBeInTheDocument()
    })

    it('handles photo with no matching measurements', () => {
      const photoWithDifferentMeasurements = {
        ...mockPhoto,
        measurements: [{ label: 'Hips', value: 38 }],
      }
      render(<PhotoEditor photo={photoWithDifferentMeasurements} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      // Config measurements should still be displayed as empty inputs
      expect(screen.getByText('Chest')).toBeInTheDocument()
      expect(screen.getByText('Waist')).toBeInTheDocument()
      expect(screen.getByText('Arms')).toBeInTheDocument()
    })
  })

  describe('delete button', () => {
    it('shows delete button when onDelete is provided', () => {
      const mockOnDelete = vi.fn()
      render(
        <PhotoEditor
          photo={mockPhoto}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          galleryConfig={mockGalleryConfig}
        />
      )

      expect(screen.getByRole('button', { name: /delete photo/i })).toBeInTheDocument()
    })

    it('hides delete button when onDelete is not provided', () => {
      render(
        <PhotoEditor
          photo={mockPhoto}
          onUpdate={mockOnUpdate}
          galleryConfig={mockGalleryConfig}
        />
      )

      expect(screen.queryByRole('button', { name: /delete photo/i })).not.toBeInTheDocument()
    })

    it('calls onDelete when delete button is clicked', () => {
      const mockOnDelete = vi.fn()
      render(
        <PhotoEditor
          photo={mockPhoto}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          galleryConfig={mockGalleryConfig}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /delete photo/i }))

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('input attributes', () => {
    it('date input has correct type', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const dateInput = screen.getByLabelText(/date/i)
      expect(dateInput).toHaveAttribute('type', 'date')
    })

    it('weight input has correct type and step', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const weightInput = screen.getByLabelText(/weight/i)
      expect(weightInput).toHaveAttribute('type', 'number')
      expect(weightInput).toHaveAttribute('step', '0.1')
    })

    it('measurement value inputs have correct type and step', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} galleryConfig={mockGalleryConfig} />)

      const valueInputs = screen.getAllByRole('spinbutton').filter(input =>
        input.id !== 'weight' && input.id !== 'date'
      )

      valueInputs.forEach((input) => {
        expect(input).toHaveAttribute('type', 'number')
        expect(input).toHaveAttribute('step', '0.1')
      })
    })
  })
})
