const DEFAULT_CONFIG = {
  unitSystem: 'imperial',
  measurements: ['Waist', 'Chest', 'Arms'],
}

export function PhotoEditor({ photo, onUpdate, galleryConfig }) {
  if (!photo) return null

  const config = galleryConfig || DEFAULT_CONFIG
  const unitSystem = config.unitSystem || 'imperial'
  const measurementLabels = config.measurements || []

  const weightUnit = unitSystem === 'metric' ? 'kg' : 'lbs'
  const measurementUnit = unitSystem === 'metric' ? 'cm' : 'in'

  const handleDateChange = (e) => {
    onUpdate(photo.id, { date: e.target.value })
  }

  const handleWeightChange = (e) => {
    const value = e.target.value === '' ? null : parseFloat(e.target.value)
    onUpdate(photo.id, { weight: value })
  }

  const handleMeasurementValueChange = (label, newValue) => {
    const existingMeasurements = photo.measurements || []
    const existingIndex = existingMeasurements.findIndex(m => m.label === label)

    let updatedMeasurements
    if (existingIndex >= 0) {
      updatedMeasurements = [...existingMeasurements]
      updatedMeasurements[existingIndex] = {
        ...updatedMeasurements[existingIndex],
        value: newValue === '' ? null : parseFloat(newValue)
      }
    } else {
      updatedMeasurements = [
        ...existingMeasurements,
        { label, value: newValue === '' ? null : parseFloat(newValue) }
      ]
    }
    onUpdate(photo.id, { measurements: updatedMeasurements })
  }

  const getMeasurementValue = (label) => {
    const measurement = (photo.measurements || []).find(m => m.label === label)
    return measurement?.value ?? ''
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
          Weight ({weightUnit})
        </label>
        <input
          type="number"
          id="weight"
          value={photo.weight ?? ''}
          onChange={handleWeightChange}
          placeholder={`Enter weight in ${weightUnit}`}
          step="0.1"
          className={inputClasses}
        />
      </div>

      {measurementLabels.length > 0 && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200">
          <h4 className="text-sm sm:text-base text-gray-600 mb-3">Measurements ({measurementUnit})</h4>
          {measurementLabels.map((label) => (
            <div key={label} className="flex gap-2 mb-3 items-center">
              <label className="flex-1 min-w-0 text-sm text-gray-700">
                {label}
              </label>
              <input
                type="number"
                value={getMeasurementValue(label)}
                onChange={(e) => handleMeasurementValueChange(label, e.target.value)}
                placeholder={measurementUnit}
                step="0.1"
                className="w-24 sm:w-28 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      )}

      {measurementLabels.length === 0 && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200">
          <p className="text-sm text-gray-400 text-center">
            No measurements configured. Open gallery settings to add measurement types.
          </p>
        </div>
      )}
    </div>
  )
}
