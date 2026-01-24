export function Navigation({
  currentIndex,
  totalPhotos,
}) {
  if (totalPhotos === 0) return null

  return (
    <div className="p-3 sm:p-4 bg-white rounded-b-xl border border-t-0 border-gray-200 flex justify-center items-center">
      <span className="text-sm text-gray-500">
        {currentIndex + 1} of {totalPhotos}
      </span>
    </div>
  )
}
