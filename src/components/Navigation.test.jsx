import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navigation } from './Navigation'

describe('Navigation', () => {
  let mockOnPrevious
  let mockOnNext
  let mockOnDelete

  beforeEach(() => {
    mockOnPrevious = vi.fn()
    mockOnNext = vi.fn()
    mockOnDelete = vi.fn()
  })

  describe('when there are no photos', () => {
    it('renders nothing', () => {
      const { container } = render(
        <Navigation
          currentIndex={0}
          totalPhotos={0}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('when there are photos', () => {
    it('renders previous button', () => {
      render(
        <Navigation
          currentIndex={1}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    })

    it('renders next button', () => {
      render(
        <Navigation
          currentIndex={1}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('renders delete button', () => {
      render(
        <Navigation
          currentIndex={0}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('displays current position', () => {
      render(
        <Navigation
          currentIndex={1}
          totalPhotos={5}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('2 of 5')).toBeInTheDocument()
    })
  })

  describe('previous button', () => {
    it('is disabled when on first photo', () => {
      render(
        <Navigation
          currentIndex={0}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
    })

    it('is enabled when not on first photo', () => {
      render(
        <Navigation
          currentIndex={1}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled()
    })

    it('calls onPrevious when clicked', async () => {
      render(
        <Navigation
          currentIndex={2}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /previous/i }))

      expect(mockOnPrevious).toHaveBeenCalledTimes(1)
    })

    it('does not call onPrevious when disabled', async () => {
      render(
        <Navigation
          currentIndex={0}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      const button = screen.getByRole('button', { name: /previous/i })
      await userEvent.click(button)

      expect(mockOnPrevious).not.toHaveBeenCalled()
    })
  })

  describe('next button', () => {
    it('is disabled when on last photo', () => {
      render(
        <Navigation
          currentIndex={2}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    })

    it('is enabled when not on last photo', () => {
      render(
        <Navigation
          currentIndex={1}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    it('calls onNext when clicked', async () => {
      render(
        <Navigation
          currentIndex={0}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /next/i }))

      expect(mockOnNext).toHaveBeenCalledTimes(1)
    })

    it('does not call onNext when disabled', async () => {
      render(
        <Navigation
          currentIndex={2}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      const button = screen.getByRole('button', { name: /next/i })
      await userEvent.click(button)

      expect(mockOnNext).not.toHaveBeenCalled()
    })
  })

  describe('delete button', () => {
    it('is always enabled when photos exist', () => {
      render(
        <Navigation
          currentIndex={0}
          totalPhotos={1}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('button', { name: /delete/i })).not.toBeDisabled()
    })

    it('calls onDelete when clicked', async () => {
      render(
        <Navigation
          currentIndex={0}
          totalPhotos={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /delete/i }))

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('handles single photo correctly', () => {
      render(
        <Navigation
          currentIndex={0}
          totalPhotos={1}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('1 of 1')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /delete/i })).not.toBeDisabled()
    })

    it('handles two photos at first position', () => {
      render(
        <Navigation
          currentIndex={0}
          totalPhotos={2}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('1 of 2')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    it('handles two photos at last position', () => {
      render(
        <Navigation
          currentIndex={1}
          totalPhotos={2}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('2 of 2')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    })

    it('handles large photo count', () => {
      render(
        <Navigation
          currentIndex={499}
          totalPhotos={1000}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('500 of 1000')).toBeInTheDocument()
    })
  })
})
