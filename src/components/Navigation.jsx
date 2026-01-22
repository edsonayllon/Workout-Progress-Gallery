export function Navigation({
  currentIndex,
  totalPhotos,
  onPrevious,
  onNext,
  onDelete
}) {
  if (totalPhotos === 0) return null

  const navBtnClasses = "bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 px-5 py-2.5 rounded-lg transition-colors"

  return (
    <div className="p-5 bg-white rounded-b-xl border border-t-0 border-gray-200 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className={navBtnClasses}
        >
          Previous
        </button>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} of {totalPhotos}
        </span>
        <button
          onClick={onNext}
          disabled={currentIndex === totalPhotos - 1}
          className={navBtnClasses}
        >
          Next
        </button>
      </div>
      <button
        onClick={onDelete}
        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg transition-colors"
      >
        Delete Photo
      </button>
    </div>
  )
}
