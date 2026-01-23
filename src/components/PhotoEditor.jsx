export function PhotoEditor({ photo, onUpdate }) {
  if (!photo) return null

  const handleDateChange = (e) => {
    onUpdate(photo.id, { date: e.target.value })
  }

  const handleWeightChange = (e) => {
    const value = e.target.value === '' ? null : parseFloat(e.target.value)
    onUpdate(photo.id, { weight: value })
  }

  const handleMeasurementLabelChange = (index, newLabel) => {
    const updatedMeasurements = [...photo.measurements]
    updatedMeasurements[index] = { ...updatedMeasurements[index], label: newLabel }
    onUpdate(photo.id, { measurements: updatedMeasurements })
  }

  const handleMeasurementValueChange = (index, newValue) => {
    const updatedMeasurements = [...photo.measurements]
    updatedMeasurements[index] = {
      ...updatedMeasurements[index],
      value: newValue === '' ? null : parseFloat(newValue)
    }
    onUpdate(photo.id, { measurements: updatedMeasurements })
  }

  const handleAddMeasurement = () => {
    const updatedMeasurements = [
      ...photo.measurements,
      { label: 'New Measurement', value: null }
    ]
    onUpdate(photo.id, { measurements: updatedMeasurements })
  }

  const handleDeleteMeasurement = (index) => {
    const updatedMeasurements = photo.measurements.filter((_, i) => i !== index)
    onUpdate(photo.id, { measurements: updatedMeasurements })
  }

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mt-4 lg:mt-0">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-5">Edit Photo Details</h3>

      <div className="mb-4 sm:mb-5">
        <label htmlFor="date" className="block mb-1.5 text-sm text-gray-600">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={photo.date}
          onChange={handleDateChange}
          className={inputClasses}
        />
      </div>

      <div className="mb-4 sm:mb-5">
        <label htmlFor="weight" className="block mb-1.5 text-sm text-gray-600">
          Weight (lbs)
        </label>
        <input
          type="number"
          id="weight"
          value={photo.weight ?? ''}
          onChange={handleWeightChange}
          placeholder="Enter weight"
          step="0.1"
          className={inputClasses}
        />
      </div>

      <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200">
        <h4 className="text-sm sm:text-base text-gray-600 mb-3">Measurements (inches)</h4>
        {photo.measurements?.map((measurement, index) => (
          <div key={index} className="flex gap-2 mb-3 items-center">
            <input
              type="text"
              value={measurement.label}
              onChange={(e) => handleMeasurementLabelChange(index, e.target.value)}
              placeholder="Label"
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              value={measurement.value ?? ''}
              onChange={(e) => handleMeasurementValueChange(index, e.target.value)}
              placeholder="Value"
              step="0.1"
              className="w-20 sm:w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => handleDeleteMeasurement(index)}
              title="Remove measurement"
              className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center border border-gray-300 rounded-lg text-gray-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button
          onClick={handleAddMeasurement}
          className="w-full py-2.5 bg-transparent text-blue-500 border border-dashed border-blue-500 rounded-lg hover:bg-blue-50 transition-colors text-sm sm:text-base"
        >
          + Add Measurement
        </button>
      </div>
    </div>
  )
}
