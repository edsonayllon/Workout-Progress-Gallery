export function Navigation({
  currentIndex,
  totalPhotos,
  onPrevious,
  onNext,
  onDelete
}) {
  if (totalPhotos === 0) return null

  return (
    <div className="p-3 sm:p-5 bg-white rounded-b-xl border border-t-0 border-gray-200 flex justify-between items-center gap-2">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 p-2 sm:px-5 sm:py-2.5 rounded-lg transition-colors"
          aria-label="Previous photo"
        >
          <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>
        <span className="text-xs sm:text-sm text-gray-500 min-w-[4rem] text-center">
          {currentIndex + 1} of {totalPhotos}
        </span>
        <button
          onClick={onNext}
          disabled={currentIndex === totalPhotos - 1}
          className="bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 p-2 sm:px-5 sm:py-2.5 rounded-lg transition-colors"
          aria-label="Next photo"
        >
          <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="hidden sm:inline">Next</span>
        </button>
      </div>
      <button
        onClick={onDelete}
        className="bg-red-500 hover:bg-red-600 text-white p-2 sm:px-5 sm:py-2.5 rounded-lg transition-colors"
        aria-label="Delete photo"
      >
        <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span className="hidden sm:inline">Delete Photo</span>
      </button>
    </div>
  )
}
