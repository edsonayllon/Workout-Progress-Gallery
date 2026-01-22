import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
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

export function usePhotoStorage() {
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

  // Subscribe to photos collection for the current user
  useEffect(() => {
    if (!userId) {
      setPhotos([])
      setIsLoaded(true)
      return
    }

    const photosQuery = query(
      collection(db, 'photos'),
      where('userId', '==', userId),
      orderBy('date', 'asc')
    )

    const unsubscribe = onSnapshot(
      photosQuery,
      (snapshot) => {
        const photosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setPhotos(photosData)
        setIsLoaded(true)
      },
      (error) => {
        console.error('Error fetching photos:', error)
        setIsLoaded(true)
      }
    )

    return () => unsubscribe()
  }, [userId])

  const addPhoto = useCallback(async (file, date) => {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Must be logged in to upload photos')
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
  }, [])

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
