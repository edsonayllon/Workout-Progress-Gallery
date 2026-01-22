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

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-5">Edit Photo Details</h3>

      <div className="mb-5">
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

      <div className="mb-5">
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

      <div className="mt-6 pt-5 border-t border-gray-200">
        <h4 className="text-base text-gray-600 mb-3">Measurements (inches)</h4>
        {photo.measurements?.map((measurement, index) => (
          <div key={index} className="flex gap-2 mb-3 items-center">
            <input
              type="text"
              value={measurement.label}
              onChange={(e) => handleMeasurementLabelChange(index, e.target.value)}
              placeholder="Label"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              value={measurement.value ?? ''}
              onChange={(e) => handleMeasurementValueChange(index, e.target.value)}
              placeholder="Value"
              step="0.1"
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => handleDeleteMeasurement(index)}
              title="Remove measurement"
              className="w-8 h-8 border border-gray-300 rounded-lg text-gray-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
            >
              X
            </button>
          </div>
        ))}
        <button
          onClick={handleAddMeasurement}
          className="w-full py-2.5 bg-transparent text-blue-500 border border-dashed border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
        >
          + Add Measurement
        </button>
      </div>
    </div>
  )
}
