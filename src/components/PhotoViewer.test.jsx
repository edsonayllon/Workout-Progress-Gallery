import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoViewer } from './PhotoViewer'

describe('PhotoViewer', () => {
  const mockPhoto = {
    id: '1',
    imageUrl: 'https://example.com/photo.jpg',
    date: '2024-06-15',
    weight: 175.5,
    measurements: [
      { label: 'Chest', value: 42 },
      { label: 'Waist', value: 32 },
    ],
  }

  const mockPreviousPhoto = {
    id: '0',
    imageUrl: 'https://example.com/previous.jpg',
    date: '2024-06-01',
    weight: 178,
    measurements: [],
  }

  let mockOnNext
  let mockOnPrevious

  beforeEach(() => {
    mockOnNext = vi.fn()
    mockOnPrevious = vi.fn()
  })

  describe('when no photo is provided', () => {
    it('renders empty state message', () => {
      render(<PhotoViewer photo={null} previousPhoto={null} />)

      expect(screen.getByText(/no photos yet/i)).toBeInTheDocument()
      expect(screen.getByText(/upload your first progress photo/i)).toBeInTheDocument()
    })

    it('does not render image', () => {
      render(<PhotoViewer photo={null} previousPhoto={null} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('when photo is provided', () => {
    it('renders the photo image', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      const img = screen.getByRole('img', { name: /progress photo/i })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', mockPhoto.imageUrl)
    })

    it('displays formatted date', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      expect(screen.getByText(/jun 15, 2024/i)).toBeInTheDocument()
    })

    it('displays weight when provided', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      expect(screen.getByText(/175.5 lbs/i)).toBeInTheDocument()
    })

    it('does not display weight when null', () => {
      const photoWithoutWeight = { ...mockPhoto, weight: null }
      render(<PhotoViewer photo={photoWithoutWeight} previousPhoto={null} />)

      expect(screen.queryByText(/lbs/i)).not.toBeInTheDocument()
    })

    it('displays measurements', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      expect(screen.getByText(/chest: 42 in/i)).toBeInTheDocument()
      expect(screen.getByText(/waist: 32 in/i)).toBeInTheDocument()
    })

    it('does not display measurements with null values', () => {
      const photoWithNullMeasurement = {
        ...mockPhoto,
        measurements: [
          { label: 'Chest', value: 42 },
          { label: 'Arms', value: null },
        ],
      }
      render(<PhotoViewer photo={photoWithNullMeasurement} previousPhoto={null} />)

      expect(screen.getByText(/chest: 42 in/i)).toBeInTheDocument()
      expect(screen.queryByText(/arms/i)).not.toBeInTheDocument()
    })

    it('handles empty measurements array', () => {
      const photoWithNoMeasurements = { ...mockPhoto, measurements: [] }
      render(<PhotoViewer photo={photoWithNoMeasurements} previousPhoto={null} />)

      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('handles undefined measurements', () => {
      const photoWithUndefinedMeasurements = { ...mockPhoto, measurements: undefined }
      render(<PhotoViewer photo={photoWithUndefinedMeasurements} previousPhoto={null} />)

      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  describe('days difference display', () => {
    it('shows days difference when previous photo exists', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={mockPreviousPhoto} />)

      expect(screen.getByText(/14 days later/i)).toBeInTheDocument()
    })

    it('shows singular "day" for 1 day difference', () => {
      const oneDayLater = { ...mockPhoto, date: '2024-06-02' }
      render(<PhotoViewer photo={oneDayLater} previousPhoto={mockPreviousPhoto} />)

      expect(screen.getByText(/1 day later/i)).toBeInTheDocument()
    })

    it('does not show days difference when no previous photo', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      expect(screen.queryByText(/days later/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/day later/i)).not.toBeInTheDocument()
    })
  })

  describe('swipe navigation', () => {
    const simulateSwipe = (element, startX, endX, startY = 100, endY = 100) => {
      fireEvent.touchStart(element, {
        touches: [{ clientX: startX, clientY: startY }],
      })
      fireEvent.touchEnd(element, {
        changedTouches: [{ clientX: endX, clientY: endY }],
      })
    }

    it('calls onPrevious when swiping right', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      )

      const container = screen.getByRole('img').parentElement
      simulateSwipe(container, 100, 200) // Swipe right (positive deltaX)

      expect(mockOnPrevious).toHaveBeenCalledTimes(1)
      expect(mockOnNext).not.toHaveBeenCalled()
    })

    it('calls onNext when swiping left', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      )

      const container = screen.getByRole('img').parentElement
      simulateSwipe(container, 200, 100) // Swipe left (negative deltaX)

      expect(mockOnNext).toHaveBeenCalledTimes(1)
      expect(mockOnPrevious).not.toHaveBeenCalled()
    })

    it('ignores swipes shorter than minimum distance', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      )

      const container = screen.getByRole('img').parentElement
      simulateSwipe(container, 100, 130) // Only 30px, less than 50px minimum

      expect(mockOnNext).not.toHaveBeenCalled()
      expect(mockOnPrevious).not.toHaveBeenCalled()
    })

    it('ignores vertical swipes', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      )

      const container = screen.getByRole('img').parentElement
      // Vertical swipe: small horizontal movement, large vertical
      simulateSwipe(container, 100, 120, 100, 300)

      expect(mockOnNext).not.toHaveBeenCalled()
      expect(mockOnPrevious).not.toHaveBeenCalled()
    })

    it('handles missing onNext callback gracefully', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onPrevious={mockOnPrevious}
        />
      )

      const container = screen.getByRole('img').parentElement

      // Should not throw when swiping left without onNext
      expect(() => {
        simulateSwipe(container, 200, 100)
      }).not.toThrow()
    })

    it('handles missing onPrevious callback gracefully', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
        />
      )

      const container = screen.getByRole('img').parentElement

      // Should not throw when swiping right without onPrevious
      expect(() => {
        simulateSwipe(container, 100, 200)
      }).not.toThrow()
    })

    it('ignores touch end without touch start', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      )

      const container = screen.getByRole('img').parentElement

      // Only fire touchEnd without touchStart
      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      })

      expect(mockOnNext).not.toHaveBeenCalled()
      expect(mockOnPrevious).not.toHaveBeenCalled()
    })
  })

  describe('image attributes', () => {
    it('has non-draggable image', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('draggable', 'false')
    })

    it('has correct alt text', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('alt', 'Progress photo')
    })
  })
})
