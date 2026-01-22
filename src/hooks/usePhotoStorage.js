import { useState, useEffect, useCallback } from 'react'
import { photosApi } from '../api/client'

export function usePhotoStorage() {
  const [photos, setPhotos] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load photos from API on mount
  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      const data = await photosApi.list()
      // Sort by date chronologically (oldest first)
      const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date))
      setPhotos(sorted)
    } catch (error) {
      console.error('Failed to load photos:', error)
    }
    setIsLoaded(true)
  }

  const addPhoto = useCallback(async (file, date) => {
    try {
      const newPhoto = await photosApi.upload(file, date)

      // Add default measurements if not present
      if (!newPhoto.measurements) {
        newPhoto.measurements = [
          { label: 'Waist', value: null },
          { label: 'Shoulders', value: null },
        ]
      }

      setPhotos(prev => {
        const updated = [...prev, newPhoto]
        return updated.sort((a, b) => new Date(a.date) - new Date(b.date))
      })

      return newPhoto.id
    } catch (error) {
      console.error('Failed to upload photo:', error)
      throw error
    }
  }, [])

  const updatePhoto = useCallback(async (id, updates) => {
    try {
      const updated = await photosApi.update(id, updates)

      setPhotos(prev => {
        const newPhotos = prev.map(photo =>
          photo.id === id ? { ...photo, ...updated } : photo
        )
        return newPhotos.sort((a, b) => new Date(a.date) - new Date(b.date))
      })
    } catch (error) {
      console.error('Failed to update photo:', error)
      throw error
    }
  }, [])

  const deletePhoto = useCallback(async (id) => {
    try {
      await photosApi.delete(id)
      setPhotos(prev => prev.filter(photo => photo.id !== id))
    } catch (error) {
      console.error('Failed to delete photo:', error)
      throw error
    }
  }, [])

  const refreshPhotos = useCallback(() => {
    setIsLoaded(false)
    loadPhotos()
  }, [])

  return {
    photos,
    isLoaded,
    addPhoto,
    updatePhoto,
    deletePhoto,
    refreshPhotos,
  }
}
