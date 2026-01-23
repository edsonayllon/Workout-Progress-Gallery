import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      expect(screen.getByText(/edit photo details/i)).toBeInTheDocument()
    })

    it('renders date input with correct value', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const dateInput = screen.getByLabelText(/date/i)
      expect(dateInput).toHaveValue('2024-06-15')
    })

    it('renders weight input with correct value', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const weightInput = screen.getByLabelText(/weight/i)
      expect(weightInput).toHaveValue(175.5)
    })

    it('renders weight input empty when weight is null', () => {
      const photoWithoutWeight = { ...mockPhoto, weight: null }
      render(<PhotoEditor photo={photoWithoutWeight} onUpdate={mockOnUpdate} />)

      const weightInput = screen.getByLabelText(/weight/i)
      expect(weightInput).toHaveValue(null)
    })

    it('renders measurements section', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      expect(screen.getByText(/measurements/i)).toBeInTheDocument()
    })

    it('renders all measurements', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      expect(screen.getByDisplayValue('Chest')).toBeInTheDocument()
      expect(screen.getByDisplayValue('42')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Waist')).toBeInTheDocument()
      expect(screen.getByDisplayValue('32')).toBeInTheDocument()
    })

    it('renders add measurement button', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      expect(screen.getByRole('button', { name: /add measurement/i })).toBeInTheDocument()
    })
  })

  describe('date editing', () => {
    it('calls onUpdate when date is changed', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const dateInput = screen.getByLabelText(/date/i)
      fireEvent.change(dateInput, { target: { value: '2024-07-01' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', { date: '2024-07-01' })
    })
  })

  describe('weight editing', () => {
    it('calls onUpdate when weight is changed', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const weightInput = screen.getByLabelText(/weight/i)
      fireEvent.change(weightInput, { target: { value: '180' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', { weight: 180 })
    })

    it('calls onUpdate with null when weight is cleared', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const weightInput = screen.getByLabelText(/weight/i)
      fireEvent.change(weightInput, { target: { value: '' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', { weight: null })
    })

    it('handles decimal weight values', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const weightInput = screen.getByLabelText(/weight/i)
      fireEvent.change(weightInput, { target: { value: '176.7' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', { weight: 176.7 })
    })
  })

  describe('measurement label editing', () => {
    it('calls onUpdate when measurement label is changed', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const labelInput = screen.getByDisplayValue('Chest')
      fireEvent.change(labelInput, { target: { value: 'Upper Chest' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: [
          { label: 'Upper Chest', value: 42 },
          { label: 'Waist', value: 32 },
        ],
      })
    })
  })

  describe('measurement value editing', () => {
    it('calls onUpdate when measurement value is changed', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const valueInput = screen.getByDisplayValue('42')
      fireEvent.change(valueInput, { target: { value: '44' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: [
          { label: 'Chest', value: 44 },
          { label: 'Waist', value: 32 },
        ],
      })
    })

    it('calls onUpdate with null when measurement value is cleared', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const valueInput = screen.getByDisplayValue('42')
      fireEvent.change(valueInput, { target: { value: '' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: [
          { label: 'Chest', value: null },
          { label: 'Waist', value: 32 },
        ],
      })
    })

    it('handles decimal measurement values', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const valueInput = screen.getByDisplayValue('42')
      fireEvent.change(valueInput, { target: { value: '42.5' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: [
          { label: 'Chest', value: 42.5 },
          { label: 'Waist', value: 32 },
        ],
      })
    })
  })

  describe('adding measurements', () => {
    it('calls onUpdate with new measurement when add button is clicked', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const addButton = screen.getByRole('button', { name: /add measurement/i })
      await userEvent.click(addButton)

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: [
          { label: 'Chest', value: 42 },
          { label: 'Waist', value: 32 },
          { label: 'New Measurement', value: null },
        ],
      })
    })

    it('works with empty measurements array', async () => {
      const photoWithNoMeasurements = { ...mockPhoto, measurements: [] }
      render(<PhotoEditor photo={photoWithNoMeasurements} onUpdate={mockOnUpdate} />)

      const addButton = screen.getByRole('button', { name: /add measurement/i })
      await userEvent.click(addButton)

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: [{ label: 'New Measurement', value: null }],
      })
    })
  })

  describe('deleting measurements', () => {
    it('renders delete buttons for each measurement', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const deleteButtons = screen.getAllByRole('button', { name: /remove measurement/i })
      expect(deleteButtons).toHaveLength(2)
    })

    it('calls onUpdate without the deleted measurement', async () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const deleteButtons = screen.getAllByRole('button', { name: /remove measurement/i })
      await userEvent.click(deleteButtons[0]) // Delete first measurement (Chest)

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: [{ label: 'Waist', value: 32 }],
      })
    })

    it('can delete the last measurement', async () => {
      const photoWithOneMeasurement = {
        ...mockPhoto,
        measurements: [{ label: 'Chest', value: 42 }],
      }
      render(<PhotoEditor photo={photoWithOneMeasurement} onUpdate={mockOnUpdate} />)

      const deleteButton = screen.getByRole('button', { name: /remove measurement/i })
      await userEvent.click(deleteButton)

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: [],
      })
    })
  })

  describe('edge cases', () => {
    it('handles undefined measurements', () => {
      const photoWithUndefinedMeasurements = { ...mockPhoto, measurements: undefined }
      render(<PhotoEditor photo={photoWithUndefinedMeasurements} onUpdate={mockOnUpdate} />)

      // Should render without crashing
      expect(screen.getByText(/edit photo details/i)).toBeInTheDocument()
    })

    it('handles measurement with null value', () => {
      const photoWithNullValue = {
        ...mockPhoto,
        measurements: [{ label: 'Chest', value: null }],
      }
      render(<PhotoEditor photo={photoWithNullValue} onUpdate={mockOnUpdate} />)

      const valueInputs = screen.getAllByPlaceholderText('Value')
      expect(valueInputs[0]).toHaveValue(null)
    })

    it('preserves other measurements when editing one', async () => {
      const photoWithThreeMeasurements = {
        ...mockPhoto,
        measurements: [
          { label: 'Chest', value: 42 },
          { label: 'Waist', value: 32 },
          { label: 'Arms', value: 15 },
        ],
      }
      render(<PhotoEditor photo={photoWithThreeMeasurements} onUpdate={mockOnUpdate} />)

      const waistValueInput = screen.getByDisplayValue('32')
      fireEvent.change(waistValueInput, { target: { value: '30' } })

      expect(mockOnUpdate).toHaveBeenCalledWith('1', {
        measurements: [
          { label: 'Chest', value: 42 },
          { label: 'Waist', value: 30 },
          { label: 'Arms', value: 15 },
        ],
      })
    })
  })

  describe('input attributes', () => {
    it('date input has correct type', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const dateInput = screen.getByLabelText(/date/i)
      expect(dateInput).toHaveAttribute('type', 'date')
    })

    it('weight input has correct type and step', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const weightInput = screen.getByLabelText(/weight/i)
      expect(weightInput).toHaveAttribute('type', 'number')
      expect(weightInput).toHaveAttribute('step', '0.1')
    })

    it('measurement value inputs have correct type and step', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const valueInputs = screen.getAllByPlaceholderText('Value')
      valueInputs.forEach((input) => {
        expect(input).toHaveAttribute('type', 'number')
        expect(input).toHaveAttribute('step', '0.1')
      })
    })

    it('measurement label inputs have correct type', () => {
      render(<PhotoEditor photo={mockPhoto} onUpdate={mockOnUpdate} />)

      const labelInputs = screen.getAllByPlaceholderText('Label')
      labelInputs.forEach((input) => {
        expect(input).toHaveAttribute('type', 'text')
      })
    })
  })
})
