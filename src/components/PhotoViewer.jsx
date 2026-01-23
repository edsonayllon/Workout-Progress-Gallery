import { useRef, useState, useEffect } from 'react'

export function PhotoViewer({ photo, previousPhoto, onNext, onPrevious }) {
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY

    const deltaX = touchEndX - touchStartX.current
    const deltaY = touchEndY - touchStartY.current

    const minSwipeDistance = 50

    // Only trigger if horizontal swipe is greater than vertical (to avoid conflicts with scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && onPrevious) {
        onPrevious()
      } else if (deltaX < 0 && onNext) {
        onNext()
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  if (!photo) {
    return (
      <div className="bg-white rounded-t-xl flex items-center justify-center min-h-[250px] sm:min-h-[400px] text-gray-400 text-base sm:text-lg border border-gray-200 p-4 text-center">
        <p>No photos yet. Upload your first progress photo!</p>
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysDifference = () => {
    if (!previousPhoto) return null
    const currentDate = new Date(photo.date)
    const prevDate = new Date(previousPhoto.date)
    const diffTime = currentDate - prevDate
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysDiff = getDaysDifference()

  const validMeasurements = photo.measurements?.filter(m => m.value != null) || []

  const FullscreenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  )

  const ExitFullscreenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  )

  const StatsOverlay = ({ fullscreen = false }) => (
    <div className={`absolute bottom-0 left-0 right-0 flex justify-center ${fullscreen ? 'pb-6' : 'pb-4'} pointer-events-none`}>
      <div className={`bg-black/50 backdrop-blur-sm rounded-xl ${fullscreen ? 'p-4 sm:p-6' : 'p-3 sm:p-4'} text-white text-center`}>
        <div className={`${fullscreen ? 'text-xl sm:text-2xl' : 'text-base sm:text-xl'} font-semibold mb-1 sm:mb-2`}>
          {formatDate(photo.date)}
          {daysDiff != null && (
            <span className={`${fullscreen ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-normal opacity-80 ml-2`}>
              ({daysDiff} {daysDiff === 1 ? 'day' : 'days'} later)
            </span>
          )}
        </div>
        {photo.weight != null && (
          <div className={`${fullscreen ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} mb-0.5 sm:mb-1`}>{photo.weight} lbs</div>
        )}
        {validMeasurements.map((measurement, index) => (
          <div key={index} className={`${fullscreen ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} opacity-90`}>
            {measurement.label}: {measurement.value} in
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <div className="bg-white rounded-t-xl overflow-hidden border border-b-0 border-gray-200">
        <div
          className="relative flex justify-center items-center bg-gray-100 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={photo.imageUrl}
            alt="Progress photo"
            className="max-w-full max-h-[50vh] sm:max-h-[70vh] object-contain select-none pointer-events-none"
            draggable={false}
          />
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
            aria-label="Enter fullscreen"
          >
            <FullscreenIcon />
          </button>
          <StatsOverlay />
        </div>
      </div>

      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            aria-label="Exit fullscreen"
          >
            <ExitFullscreenIcon />
          </button>

          {onPrevious && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              aria-label="Previous photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              aria-label="Next photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={photo.imageUrl}
              alt="Progress photo"
              className="max-w-full max-h-full object-contain select-none pointer-events-none"
              draggable={false}
            />
            <StatsOverlay fullscreen />
          </div>
        </div>
      )}
    </>
  )
}
