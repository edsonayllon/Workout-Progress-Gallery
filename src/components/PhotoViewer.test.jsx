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

  const defaultGalleryConfig = {
    unitSystem: 'imperial',
    measurements: ['Chest', 'Waist', 'Arms'],
    ratios: [],
    sortOrder: 'chronological',
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
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} galleryConfig={defaultGalleryConfig} />)

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
      render(<PhotoViewer photo={photoWithNullMeasurement} previousPhoto={null} galleryConfig={defaultGalleryConfig} />)

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

    it('shows "days before" in reverse chronological mode', () => {
      const reverseConfig = { ...defaultGalleryConfig, sortOrder: 'reverseChronological' }
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={mockPreviousPhoto}
          galleryConfig={reverseConfig}
        />
      )

      expect(screen.getByText(/14 days before/i)).toBeInTheDocument()
    })

    it('shows singular "day before" for 1 day difference in reverse mode', () => {
      const oneDayBefore = { ...mockPhoto, date: '2024-06-02' }
      const reverseConfig = { ...defaultGalleryConfig, sortOrder: 'reverseChronological' }
      render(
        <PhotoViewer
          photo={oneDayBefore}
          previousPhoto={mockPreviousPhoto}
          galleryConfig={reverseConfig}
        />
      )

      expect(screen.getByText(/1 day before/i)).toBeInTheDocument()
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

  describe('gallery config', () => {
    const mockGalleryConfig = {
      unitSystem: 'metric',
      measurements: ['Chest', 'Waist'],
      ratios: [],
    }

    it('uses metric units when config specifies metric', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          galleryConfig={mockGalleryConfig}
        />
      )

      expect(screen.getByText(/175.5 kg/i)).toBeInTheDocument()
      expect(screen.getByText(/chest: 42 cm/i)).toBeInTheDocument()
    })

    it('uses imperial units by default', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} galleryConfig={defaultGalleryConfig} />)

      expect(screen.getByText(/175.5 lbs/i)).toBeInTheDocument()
      expect(screen.getByText(/chest: 42 in/i)).toBeInTheDocument()
    })

    it('only displays measurements that exist in config', () => {
      const photoWithExtraMeasurement = {
        ...mockPhoto,
        measurements: [
          { label: 'Chest', value: 42 },
          { label: 'Waist', value: 32 },
          { label: 'Arms', value: 15 }, // Not in config
        ],
      }
      const configWithLimitedMeasurements = {
        unitSystem: 'imperial',
        measurements: ['Chest'], // Only Chest is in config
        ratios: [],
      }

      render(
        <PhotoViewer
          photo={photoWithExtraMeasurement}
          previousPhoto={null}
          galleryConfig={configWithLimitedMeasurements}
        />
      )

      expect(screen.getByText(/chest: 42 in/i)).toBeInTheDocument()
      expect(screen.queryByText(/waist/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/arms/i)).not.toBeInTheDocument()
    })

    it('filters out old measurements after config reset', () => {
      const photoWithOldMeasurement = {
        ...mockPhoto,
        measurements: [
          { label: 'OldMeasurement', value: 50 },
          { label: 'Chest', value: 42 },
        ],
      }
      const newConfig = {
        unitSystem: 'imperial',
        measurements: ['Chest', 'Waist'], // OldMeasurement not included
        ratios: [],
      }

      render(
        <PhotoViewer
          photo={photoWithOldMeasurement}
          previousPhoto={null}
          galleryConfig={newConfig}
        />
      )

      expect(screen.getByText(/chest: 42 in/i)).toBeInTheDocument()
      expect(screen.queryByText(/oldmeasurement/i)).not.toBeInTheDocument()
    })
  })

  describe('ratio calculations', () => {
    const photoWithMeasurements = {
      ...mockPhoto,
      measurements: [
        { label: 'Shoulders', value: 48 },
        { label: 'Waist', value: 32 },
        { label: 'Chest', value: 42 },
      ],
    }

    it('displays calculated ratios', () => {
      const configWithRatio = {
        unitSystem: 'imperial',
        measurements: ['Shoulders', 'Waist', 'Chest'],
        ratios: [
          { name: 'Shoulder-to-Waist', numerator: 'Shoulders', denominator: 'Waist' }
        ],
      }

      render(
        <PhotoViewer
          photo={photoWithMeasurements}
          previousPhoto={null}
          galleryConfig={configWithRatio}
        />
      )

      // 48 / 32 = 1.5
      expect(screen.getByText(/shoulder-to-waist: 1.5/i)).toBeInTheDocument()
    })

    it('displays ratio with up to 3 decimal places', () => {
      const photoWithOddMeasurements = {
        ...mockPhoto,
        measurements: [
          { label: 'Shoulders', value: 47 },
          { label: 'Waist', value: 32 },
        ],
      }
      const configWithRatio = {
        unitSystem: 'imperial',
        measurements: ['Shoulders', 'Waist'],
        ratios: [
          { name: 'S-to-W', numerator: 'Shoulders', denominator: 'Waist' }
        ],
      }

      render(
        <PhotoViewer
          photo={photoWithOddMeasurements}
          previousPhoto={null}
          galleryConfig={configWithRatio}
        />
      )

      // 47 / 32 = 1.46875 -> 1.469
      expect(screen.getByText(/s-to-w: 1.469/i)).toBeInTheDocument()
    })

    it('removes trailing zeros from ratios', () => {
      const configWithRatio = {
        unitSystem: 'imperial',
        measurements: ['Shoulders', 'Waist'],
        ratios: [
          { name: 'Ratio', numerator: 'Shoulders', denominator: 'Waist' }
        ],
      }

      render(
        <PhotoViewer
          photo={photoWithMeasurements}
          previousPhoto={null}
          galleryConfig={configWithRatio}
        />
      )

      // 48 / 32 = 1.5 (not 1.500)
      expect(screen.getByText('Ratio: 1.5')).toBeInTheDocument()
    })

    it('does not display ratio when numerator measurement missing', () => {
      const photoMissingMeasurement = {
        ...mockPhoto,
        measurements: [
          { label: 'Waist', value: 32 },
        ],
      }
      const configWithRatio = {
        unitSystem: 'imperial',
        measurements: ['Shoulders', 'Waist'],
        ratios: [
          { name: 'S-to-W', numerator: 'Shoulders', denominator: 'Waist' }
        ],
      }

      render(
        <PhotoViewer
          photo={photoMissingMeasurement}
          previousPhoto={null}
          galleryConfig={configWithRatio}
        />
      )

      expect(screen.queryByText(/s-to-w/i)).not.toBeInTheDocument()
    })

    it('does not display ratio when denominator is zero', () => {
      const photoWithZero = {
        ...mockPhoto,
        measurements: [
          { label: 'Shoulders', value: 48 },
          { label: 'Waist', value: 0 },
        ],
      }
      const configWithRatio = {
        unitSystem: 'imperial',
        measurements: ['Shoulders', 'Waist'],
        ratios: [
          { name: 'S-to-W', numerator: 'Shoulders', denominator: 'Waist' }
        ],
      }

      render(
        <PhotoViewer
          photo={photoWithZero}
          previousPhoto={null}
          galleryConfig={configWithRatio}
        />
      )

      expect(screen.queryByText(/s-to-w/i)).not.toBeInTheDocument()
    })

    it('displays multiple ratios', () => {
      const configWithMultipleRatios = {
        unitSystem: 'imperial',
        measurements: ['Shoulders', 'Waist', 'Chest'],
        ratios: [
          { name: 'S-to-W', numerator: 'Shoulders', denominator: 'Waist' },
          { name: 'C-to-W', numerator: 'Chest', denominator: 'Waist' },
        ],
      }

      render(
        <PhotoViewer
          photo={photoWithMeasurements}
          previousPhoto={null}
          galleryConfig={configWithMultipleRatios}
        />
      )

      expect(screen.getByText(/s-to-w: 1.5/i)).toBeInTheDocument()
      expect(screen.getByText(/c-to-w: 1.313/i)).toBeInTheDocument() // 42/32 = 1.3125 -> rounds to 1.313
    })

    it('handles empty ratios array', () => {
      const configWithNoRatios = {
        unitSystem: 'imperial',
        measurements: ['Shoulders', 'Waist'],
        ratios: [],
      }

      render(
        <PhotoViewer
          photo={photoWithMeasurements}
          previousPhoto={null}
          galleryConfig={configWithNoRatios}
        />
      )

      // Should render without errors
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  describe('navigation arrows on photo', () => {
    it('shows previous button when hasPrevious is true', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onPrevious={mockOnPrevious}
          hasPrevious={true}
          hasNext={false}
        />
      )

      const prevButtons = screen.getAllByRole('button', { name: /previous photo/i })
      expect(prevButtons.length).toBeGreaterThan(0)
    })

    it('hides previous button when hasPrevious is false', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onPrevious={mockOnPrevious}
          hasPrevious={false}
          hasNext={true}
        />
      )

      // Should only have fullscreen button visible initially, not previous
      const buttons = screen.getAllByRole('button')
      const prevButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Previous photo')
      expect(prevButton).toBeUndefined()
    })

    it('shows next button when hasNext is true', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          hasPrevious={false}
          hasNext={true}
        />
      )

      const nextButtons = screen.getAllByRole('button', { name: /next photo/i })
      expect(nextButtons.length).toBeGreaterThan(0)
    })

    it('hides next button when hasNext is false', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          hasPrevious={true}
          hasNext={false}
        />
      )

      const buttons = screen.getAllByRole('button')
      const nextButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Next photo')
      expect(nextButton).toBeUndefined()
    })

    it('calls onPrevious when previous button clicked', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onPrevious={mockOnPrevious}
          hasPrevious={true}
          hasNext={false}
        />
      )

      const prevButton = screen.getAllByRole('button', { name: /previous photo/i })[0]
      fireEvent.click(prevButton)

      expect(mockOnPrevious).toHaveBeenCalledTimes(1)
    })

    it('calls onNext when next button clicked', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          hasPrevious={false}
          hasNext={true}
        />
      )

      const nextButton = screen.getAllByRole('button', { name: /next photo/i })[0]
      fireEvent.click(nextButton)

      expect(mockOnNext).toHaveBeenCalledTimes(1)
    })
  })

  describe('fullscreen mode', () => {
    it('renders fullscreen button when photo exists', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
      expect(fullscreenBtn).toBeInTheDocument()
    })

    it('does not render fullscreen button when no photo', () => {
      render(<PhotoViewer photo={null} previousPhoto={null} />)

      expect(screen.queryByRole('button', { name: /enter fullscreen/i })).not.toBeInTheDocument()
    })

    it('opens fullscreen mode when fullscreen button is clicked', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
      fireEvent.click(fullscreenBtn)

      const exitBtn = screen.getByRole('button', { name: /exit fullscreen/i })
      expect(exitBtn).toBeInTheDocument()
    })

    it('closes fullscreen mode when exit button is clicked', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      // Open fullscreen
      const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
      fireEvent.click(fullscreenBtn)

      // Close fullscreen
      const exitBtn = screen.getByRole('button', { name: /exit fullscreen/i })
      fireEvent.click(exitBtn)

      expect(screen.queryByRole('button', { name: /exit fullscreen/i })).not.toBeInTheDocument()
    })

    it('closes fullscreen mode when Escape key is pressed', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      // Open fullscreen
      const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
      fireEvent.click(fullscreenBtn)

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' })

      expect(screen.queryByRole('button', { name: /exit fullscreen/i })).not.toBeInTheDocument()
    })

    it('displays photo stats in fullscreen mode', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={mockPreviousPhoto} galleryConfig={defaultGalleryConfig} />)

      // Open fullscreen
      const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
      fireEvent.click(fullscreenBtn)

      // Stats should still be visible (there will be duplicates - one in normal view, one in fullscreen)
      expect(screen.getAllByText(/175.5 lbs/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/chest: 42 in/i).length).toBeGreaterThan(0)
    })

    it('shows navigation buttons in fullscreen when callbacks provided', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      )

      // Open fullscreen
      const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
      fireEvent.click(fullscreenBtn)

      expect(screen.getByRole('button', { name: /previous photo/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next photo/i })).toBeInTheDocument()
    })

    it('calls onNext when next button clicked in fullscreen', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      )

      // Open fullscreen
      const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
      fireEvent.click(fullscreenBtn)

      const nextBtn = screen.getByRole('button', { name: /next photo/i })
      fireEvent.click(nextBtn)

      expect(mockOnNext).toHaveBeenCalledTimes(1)
    })

    it('calls onPrevious when previous button clicked in fullscreen', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      )

      // Open fullscreen
      const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
      fireEvent.click(fullscreenBtn)

      const prevBtn = screen.getByRole('button', { name: /previous photo/i })
      fireEvent.click(prevBtn)

      expect(mockOnPrevious).toHaveBeenCalledTimes(1)
    })

    it('does not show navigation buttons when callbacks not provided', () => {
      render(<PhotoViewer photo={mockPhoto} previousPhoto={null} />)

      // Open fullscreen
      const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
      fireEvent.click(fullscreenBtn)

      expect(screen.queryByRole('button', { name: /previous photo/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /next photo/i })).not.toBeInTheDocument()
    })

    it('supports swipe navigation in fullscreen mode', () => {
      render(
        <PhotoViewer
          photo={mockPhoto}
          previousPhoto={null}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      )

      // Open fullscreen
      const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
      fireEvent.click(fullscreenBtn)

      // Find the fullscreen container (the fixed overlay)
      const fullscreenOverlay = document.querySelector('.fixed.inset-0')

      // Swipe left
      fireEvent.touchStart(fullscreenOverlay, {
        touches: [{ clientX: 200, clientY: 100 }],
      })
      fireEvent.touchEnd(fullscreenOverlay, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      })

      expect(mockOnNext).toHaveBeenCalledTimes(1)
    })
  })
})
