import { useState, useEffect, useRef } from 'react'
import { RatioEditor } from './RatioEditor'

export function GallerySettings({ gallery, globalConfig, galleryCount, onUpdate, onClear, onRename, onDelete, onClose }) {
  const hasOverride = !!gallery?.config
  const effectiveConfig = hasOverride ? gallery.config : globalConfig

  const [galleryName, setGalleryName] = useState(gallery?.name || '')
  const [unitSystem, setUnitSystem] = useState(effectiveConfig?.unitSystem || 'imperial')
  const [measurements, setMeasurements] = useState(effectiveConfig?.measurements || [])
  const [ratios, setRatios] = useState(effectiveConfig?.ratios || [])
  const [newMeasurement, setNewMeasurement] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (gallery) {
      setGalleryName(gallery.name || '')
    }
  }, [gallery])

  useEffect(() => {
    const config = hasOverride ? gallery.config : globalConfig
    if (config) {
      setUnitSystem(config.unitSystem || 'imperial')
      setMeasurements(config.measurements || [])
      setRatios(config.ratios || [])
    }
  }, [gallery, globalConfig, hasOverride])

  const handleAddMeasurement = () => {
    const trimmed = newMeasurement.trim()
    if (trimmed && !measurements.includes(trimmed)) {
      setMeasurements([...measurements, trimmed])
      setNewMeasurement('')
    }
  }

  const handleRemoveMeasurement = (index) => {
    const removedMeasurement = measurements[index]
    setMeasurements(measurements.filter((_, i) => i !== index))
    // Remove any ratios that use this measurement
    setRatios(ratios.filter(r => r.numerator !== removedMeasurement && r.denominator !== removedMeasurement))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddMeasurement()
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Rename if name changed
      if (galleryName.trim() && galleryName.trim() !== gallery.name) {
        await onRename(gallery.id, galleryName.trim())
      }
      // Update config
      await onUpdate(gallery.id, { unitSystem, measurements, ratios })
      onClose()
    } catch (error) {
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Reset this gallery to use default settings?')) return
    setIsClearing(true)
    try {
      await onClear(gallery.id)
      onClose()
    } catch (error) {
      alert('Failed to reset settings')
    } finally {
      setIsClearing(false)
    }
  }

  const handleDelete = async () => {
    if (galleryCount <= 1) {
      alert('Cannot delete the only gallery')
      return
    }
    if (!confirm(`Delete "${gallery.name}" and all its photos? This cannot be undone.`)) return
    setIsDeleting(true)
    try {
      await onDelete(gallery.id)
      onClose()
    } catch (error) {
      alert('Failed to delete gallery')
    } finally {
      setIsDeleting(false)
    }
  }

  const weightUnit = unitSystem === 'metric' ? 'kg' : 'lbs'
  const measurementUnit = unitSystem === 'metric' ? 'cm' : 'in'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Gallery Settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasOverride ? (
                <span className="text-amber-600">Custom settings for this gallery</span>
              ) : (
                <span>Using default settings</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <div>
            <label htmlFor="gallery-name" className="block text-sm font-medium text-gray-700 mb-2">
              Gallery Name
            </label>
            <input
              ref={nameInputRef}
              id="gallery-name"
              type="text"
              value={galleryName}
              onChange={(e) => setGalleryName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter gallery name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit System
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setUnitSystem('imperial')}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  unitSystem === 'imperial'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Imperial ({weightUnit}, {measurementUnit === 'in' ? 'in' : measurementUnit})
              </button>
              <button
                onClick={() => setUnitSystem('metric')}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  unitSystem === 'metric'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Metric (kg, cm)
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Weight in {weightUnit}, measurements in {measurementUnit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Measurement Types
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Define the measurements you want to track for photos in this gallery
            </p>

            <div className="space-y-2 mb-3">
              {measurements.map((measurement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <span className="flex-1 text-sm text-gray-700">{measurement}</span>
                  <button
                    onClick={() => handleRemoveMeasurement(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {measurements.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">No measurements defined</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMeasurement}
                onChange={(e) => setNewMeasurement(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add measurement (e.g., Waist)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddMeasurement}
                disabled={!newMeasurement.trim()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Measurement Ratios
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Calculate ratios between measurements (e.g., Shoulder-to-Waist)
            </p>
            <RatioEditor
              measurements={measurements}
              ratios={ratios}
              onChange={setRatios}
            />
          </div>

          {hasOverride && (
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={handleClear}
                disabled={isClearing}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Reset to default settings</span>
                  </>
                )}
              </button>
            </div>
          )}

          {galleryCount > 1 && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Gallery</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-blue-300 transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              hasOverride ? 'Save Changes' : 'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
