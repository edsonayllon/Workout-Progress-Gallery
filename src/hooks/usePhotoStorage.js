import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { v4 as uuidv4 } from 'uuid'
import { db, storage, auth } from '../firebase'

export function usePhotoStorage(galleryId = null) {
  const [photos, setPhotos] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState(null)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null)
    })
    return () => unsubscribe()
  }, [])

  // Subscribe to photos collection for the current user and gallery
  useEffect(() => {
    if (!userId || !galleryId) {
      setPhotos([])
      setIsLoaded(true)
      return
    }

    // Reset photos when gallery changes to avoid showing stale data
    setPhotos([])
    setIsLoaded(false)

    // Query without orderBy to avoid needing composite index
    const photosQuery = query(
      collection(db, 'photos'),
      where('userId', '==', userId),
      where('galleryId', '==', galleryId)
    )

    const unsubscribe = onSnapshot(
      photosQuery,
      (snapshot) => {
        const photosData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        // Sort by date client-side
        photosData.sort((a, b) => new Date(a.date) - new Date(b.date))
        setPhotos(photosData)
        setIsLoaded(true)
      },
      (error) => {
        console.error('Error fetching photos:', error)
        setPhotos([])
        setIsLoaded(true)
      }
    )

    return () => unsubscribe()
  }, [userId, galleryId])

  const addPhoto = useCallback(async (file, date) => {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Must be logged in to upload photos')
    }

    if (!galleryId) {
      throw new Error('No gallery selected')
    }

    try {
      // Generate unique filename
      const ext = file.name.split('.').pop()
      const filename = `${uuidv4()}.${ext}`
      const storagePath = `photos/${user.uid}/${filename}`

      // Upload file to Firebase Storage
      const storageRef = ref(storage, storagePath)
      await uploadBytes(storageRef, file)

      // Get download URL
      const imageUrl = await getDownloadURL(storageRef)

      // Create Firestore document
      const photoData = {
        userId: user.uid,
        galleryId,
        storagePath,
        imageUrl,
        date: date || new Date().toISOString().split('T')[0],
        weight: null,
        measurements: [
          { label: 'Waist', value: null },
          { label: 'Shoulders', value: null },
        ],
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'photos'), photoData)
      return docRef.id
    } catch (error) {
      console.error('Failed to upload photo:', error)
      throw error
    }
  }, [galleryId])

  const updatePhoto = useCallback(async (id, updates) => {
    try {
      const photoRef = doc(db, 'photos', id)
      await updateDoc(photoRef, updates)
    } catch (error) {
      console.error('Failed to update photo:', error)
      throw error
    }
  }, [])

  const deletePhoto = useCallback(async (id) => {
    try {
      // Find the photo to get the storage path
      const photo = photos.find((p) => p.id === id)
      if (photo?.storagePath) {
        // Delete from Firebase Storage
        const storageRef = ref(storage, photo.storagePath)
        await deleteObject(storageRef).catch((error) => {
          // Ignore error if file doesn't exist
          if (error.code !== 'storage/object-not-found') {
            console.error('Error deleting file from storage:', error)
          }
        })
      }

      // Delete Firestore document
      await deleteDoc(doc(db, 'photos', id))
    } catch (error) {
      console.error('Failed to delete photo:', error)
      throw error
    }
  }, [photos])

  const refreshPhotos = useCallback(() => {
    setIsLoaded(false)
    setTimeout(() => setIsLoaded(true), 100)
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
