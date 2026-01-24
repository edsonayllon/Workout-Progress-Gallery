import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RatioEditor } from './RatioEditor'

describe('RatioEditor', () => {
  let mockOnChange

  beforeEach(() => {
    mockOnChange = vi.fn()
  })

  describe('when fewer than 2 measurements', () => {
    it('shows message when no measurements', () => {
      render(<RatioEditor measurements={[]} ratios={[]} onChange={mockOnChange} />)

      expect(screen.getByText(/add at least 2 measurements/i)).toBeInTheDocument()
    })

    it('shows message when only 1 measurement', () => {
      render(<RatioEditor measurements={['Waist']} ratios={[]} onChange={mockOnChange} />)

      expect(screen.getByText(/add at least 2 measurements/i)).toBeInTheDocument()
    })
  })

  describe('with 2 or more measurements', () => {
    const measurements = ['Shoulders', 'Waist', 'Chest']

    it('shows add ratio button', () => {
      render(<RatioEditor measurements={measurements} ratios={[]} onChange={mockOnChange} />)

      expect(screen.getByText(/\+ add ratio/i)).toBeInTheDocument()
    })

    it('shows no ratios message when empty', () => {
      render(<RatioEditor measurements={measurements} ratios={[]} onChange={mockOnChange} />)

      expect(screen.getByText(/no ratios defined/i)).toBeInTheDocument()
    })

    it('displays existing ratios', () => {
      const ratios = [
        { name: 'Shoulder-to-Waist', numerator: 'Shoulders', denominator: 'Waist' }
      ]
      render(<RatioEditor measurements={measurements} ratios={ratios} onChange={mockOnChange} />)

      expect(screen.getByText('Shoulder-to-Waist')).toBeInTheDocument()
      expect(screen.getByText('Shoulders / Waist')).toBeInTheDocument()
    })

    it('opens add form when add button clicked', () => {
      render(<RatioEditor measurements={measurements} ratios={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText(/\+ add ratio/i))

      expect(screen.getByPlaceholderText(/ratio name/i)).toBeInTheDocument()
      expect(screen.getByText('Numerator')).toBeInTheDocument()
      expect(screen.getByText('Denominator')).toBeInTheDocument()
    })

    it('closes form when cancel clicked', () => {
      render(<RatioEditor measurements={measurements} ratios={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText(/\+ add ratio/i))
      fireEvent.click(screen.getByText('Cancel'))

      expect(screen.queryByPlaceholderText(/ratio name/i)).not.toBeInTheDocument()
    })

    it('adds ratio when form is filled and submitted', () => {
      render(<RatioEditor measurements={measurements} ratios={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText(/\+ add ratio/i))

      const nameInput = screen.getByPlaceholderText(/ratio name/i)
      fireEvent.change(nameInput, { target: { value: 'Shoulder-to-Waist' } })

      const selects = screen.getAllByRole('combobox')
      fireEvent.change(selects[0], { target: { value: 'Shoulders' } })
      fireEvent.change(selects[1], { target: { value: 'Waist' } })

      fireEvent.click(screen.getByText('Add Ratio'))

      expect(mockOnChange).toHaveBeenCalledWith([
        { name: 'Shoulder-to-Waist', numerator: 'Shoulders', denominator: 'Waist' }
      ])
    })

    it('removes ratio when remove button clicked', () => {
      const ratios = [
        { name: 'Shoulder-to-Waist', numerator: 'Shoulders', denominator: 'Waist' }
      ]
      render(<RatioEditor measurements={measurements} ratios={ratios} onChange={mockOnChange} />)

      const removeButton = screen.getByTitle('Remove')
      fireEvent.click(removeButton)

      expect(mockOnChange).toHaveBeenCalledWith([])
    })

    it('prevents adding ratio with same numerator and denominator', () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
      render(<RatioEditor measurements={measurements} ratios={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText(/\+ add ratio/i))

      const nameInput = screen.getByPlaceholderText(/ratio name/i)
      fireEvent.change(nameInput, { target: { value: 'Same-to-Same' } })

      const selects = screen.getAllByRole('combobox')
      fireEvent.change(selects[0], { target: { value: 'Waist' } })
      fireEvent.change(selects[1], { target: { value: 'Waist' } })

      fireEvent.click(screen.getByText('Add Ratio'))

      expect(alertMock).toHaveBeenCalledWith('Numerator and denominator must be different measurements')
      expect(mockOnChange).not.toHaveBeenCalled()
      alertMock.mockRestore()
    })

    it('prevents adding duplicate ratio name', () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const ratios = [
        { name: 'Shoulder-to-Waist', numerator: 'Shoulders', denominator: 'Waist' }
      ]
      render(<RatioEditor measurements={measurements} ratios={ratios} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText(/\+ add ratio/i))

      const nameInput = screen.getByPlaceholderText(/ratio name/i)
      fireEvent.change(nameInput, { target: { value: 'Shoulder-to-Waist' } })

      const selects = screen.getAllByRole('combobox')
      fireEvent.change(selects[0], { target: { value: 'Chest' } })
      fireEvent.change(selects[1], { target: { value: 'Waist' } })

      fireEvent.click(screen.getByText('Add Ratio'))

      expect(alertMock).toHaveBeenCalledWith('A ratio with this name already exists')
      alertMock.mockRestore()
    })

    it('disables add button when form is incomplete', () => {
      render(<RatioEditor measurements={measurements} ratios={[]} onChange={mockOnChange} />)

      fireEvent.click(screen.getByText(/\+ add ratio/i))

      const addButton = screen.getByText('Add Ratio')
      expect(addButton).toBeDisabled()
    })
  })
})
