import { useState } from 'react'

export function RatioEditor({ measurements, ratios, onChange }) {
  const [isAdding, setIsAdding] = useState(false)
  const [newRatio, setNewRatio] = useState({ name: '', numerator: '', denominator: '' })

  const handleAdd = () => {
    if (!newRatio.name.trim() || !newRatio.numerator || !newRatio.denominator) {
      return
    }
    if (newRatio.numerator === newRatio.denominator) {
      alert('Numerator and denominator must be different measurements')
      return
    }
    const exists = ratios.some(r => r.name === newRatio.name.trim())
    if (exists) {
      alert('A ratio with this name already exists')
      return
    }
    onChange([...ratios, {
      name: newRatio.name.trim(),
      numerator: newRatio.numerator,
      denominator: newRatio.denominator
    }])
    setNewRatio({ name: '', numerator: '', denominator: '' })
    setIsAdding(false)
  }

  const handleRemove = (index) => {
    onChange(ratios.filter((_, i) => i !== index))
  }

  const handleCancel = () => {
    setNewRatio({ name: '', numerator: '', denominator: '' })
    setIsAdding(false)
  }

  if (measurements.length < 2) {
    return (
      <p className="text-sm text-gray-400 text-center py-2">
        Add at least 2 measurements to create ratios
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {ratios.map((ratio, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-700 block truncate">{ratio.name}</span>
            <span className="text-xs text-gray-500">{ratio.numerator} / {ratio.denominator}</span>
          </div>
          <button
            onClick={() => handleRemove(index)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      {ratios.length === 0 && !isAdding && (
        <p className="text-sm text-gray-400 text-center py-2">No ratios defined</p>
      )}

      {isAdding ? (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={newRatio.name}
            onChange={(e) => setNewRatio({ ...newRatio, name: e.target.value })}
            placeholder="Ratio name (e.g., Shoulder-to-Waist)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center gap-2">
            <select
              value={newRatio.numerator}
              onChange={(e) => setNewRatio({ ...newRatio, numerator: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Numerator</option>
              {measurements.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span className="text-gray-500 font-medium">/</span>
            <select
              value={newRatio.denominator}
              onChange={(e) => setNewRatio({ ...newRatio, denominator: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Denominator</option>
              {measurements.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newRatio.name.trim() || !newRatio.numerator || !newRatio.denominator}
              className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Ratio
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-2 bg-transparent text-blue-500 border border-dashed border-blue-500 rounded-lg hover:bg-blue-50 transition-colors text-sm"
        >
          + Add Ratio
        </button>
      )}
    </div>
  )
}
