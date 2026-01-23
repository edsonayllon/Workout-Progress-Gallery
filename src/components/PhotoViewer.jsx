import { useRef } from 'react'

export function PhotoViewer({ photo, previousPhoto, onNext, onPrevious }) {
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

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

  return (
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
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 bg-gradient-to-t from-black/70 to-transparent text-white">
          <div className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">
            {formatDate(photo.date)}
            {daysDiff != null && (
              <span className="text-sm sm:text-base font-normal opacity-80 ml-2">
                ({daysDiff} {daysDiff === 1 ? 'day' : 'days'} later)
              </span>
            )}
          </div>
          {photo.weight != null && (
            <div className="text-base sm:text-lg mb-0.5 sm:mb-1">{photo.weight} lbs</div>
          )}
          {validMeasurements.map((measurement, index) => (
            <div key={index} className="text-sm sm:text-base opacity-90">
              {measurement.label}: {measurement.value} in
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
