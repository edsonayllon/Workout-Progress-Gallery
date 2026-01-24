import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Navigation } from './Navigation'

describe('Navigation', () => {
  describe('when no photos exist', () => {
    it('renders nothing', () => {
      const { container } = render(
        <Navigation currentIndex={0} totalPhotos={0} />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('when photos exist', () => {
    it('displays current position', () => {
      render(<Navigation currentIndex={2} totalPhotos={10} />)

      expect(screen.getByText('3 of 10')).toBeInTheDocument()
    })

    it('displays first position correctly', () => {
      render(<Navigation currentIndex={0} totalPhotos={5} />)

      expect(screen.getByText('1 of 5')).toBeInTheDocument()
    })

    it('displays last position correctly', () => {
      render(<Navigation currentIndex={4} totalPhotos={5} />)

      expect(screen.getByText('5 of 5')).toBeInTheDocument()
    })

    it('displays single photo correctly', () => {
      render(<Navigation currentIndex={0} totalPhotos={1} />)

      expect(screen.getByText('1 of 1')).toBeInTheDocument()
    })
  })
})
