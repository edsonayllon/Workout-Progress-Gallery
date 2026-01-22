export function PhotoViewer({ photo, previousPhoto }) {
  if (!photo) {
    return (
      <div className="bg-white rounded-t-xl flex items-center justify-center min-h-[400px] text-gray-400 text-lg border border-gray-200">
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

  // Filter measurements that have values
  const validMeasurements = photo.measurements?.filter(m => m.value != null) || []

  return (
    <div className="bg-white rounded-t-xl overflow-hidden border border-b-0 border-gray-200">
      <div className="relative flex justify-center items-center bg-gray-100">
        <img
          src={photo.imageUrl}
          alt="Progress photo"
          className="max-w-full max-h-[70vh] object-contain"
        />
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 to-transparent text-white">
          <div className="text-xl font-semibold mb-2">
            {formatDate(photo.date)}
            {daysDiff != null && (
              <span className="text-base font-normal opacity-80 ml-2">
                ({daysDiff} {daysDiff === 1 ? 'day' : 'days'} later)
              </span>
            )}
          </div>
          {photo.weight != null && (
            <div className="text-lg mb-1">{photo.weight} lbs</div>
          )}
          {validMeasurements.map((measurement, index) => (
            <div key={index} className="text-base opacity-90">
              {measurement.label}: {measurement.value} in
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
