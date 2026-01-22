import { useState, useEffect } from 'react'

const STORAGE_KEY = 'workout-progress-photos'

export function usePhotoStorage() {
  const [photos, setPhotos] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load photos from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Sort by date chronologically (oldest first)
        const sorted = parsed.sort((a, b) => new Date(a.date) - new Date(b.date))
        setPhotos(sorted)
      }
    } catch (error) {
      console.error('Failed to load photos from localStorage:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save photos to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(photos))
      } catch (error) {
        console.error('Failed to save photos to localStorage:', error)
      }
    }
  }, [photos, isLoaded])

  const addPhoto = (photoData) => {
    const newPhoto = {
      id: Date.now().toString(),
      src: photoData.src,
      date: photoData.date || new Date().toISOString().split('T')[0],
      weight: null,
      measurements: [
        { label: 'Waist', value: null },
        { label: 'Shoulders', value: null }
      ]
    }
    setPhotos(prev => {
      const updated = [...prev, newPhoto]
      // Sort by date chronologically
      return updated.sort((a, b) => new Date(a.date) - new Date(b.date))
    })
    return newPhoto.id
  }

  const updatePhoto = (id, updates) => {
    setPhotos(prev => {
      const updated = prev.map(photo =>
        photo.id === id ? { ...photo, ...updates } : photo
      )
      // Re-sort if date changed
      return updated.sort((a, b) => new Date(a.date) - new Date(b.date))
    })
  }

  const deletePhoto = (id) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id))
  }

  return {
    photos,
    isLoaded,
    addPhoto,
    updatePhoto,
    deletePhoto
  }
}
