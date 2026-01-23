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
  writeBatch,
  getDocs,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../firebase'

const DEFAULT_GALLERY_NAME = 'Default'

export function useGalleries() {
  const [galleries, setGalleries] = useState([])
  const [currentGalleryId, setCurrentGalleryId] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState(null)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null)
    })
    return () => unsubscribe()
  }, [])

  // Subscribe to galleries collection for the current user
  useEffect(() => {
    if (!userId) {
      setGalleries([])
      setCurrentGalleryId(null)
      setIsLoaded(true)
      return
    }

    let hasCreatedDefault = false

    const galleriesQuery = query(
      collection(db, 'galleries'),
      where('userId', '==', userId)
    )

    const unsubscribe = onSnapshot(
      galleriesQuery,
      async (snapshot) => {
        let galleriesData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))

        // Sort by createdAt client-side to avoid needing composite index
        galleriesData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0
          const bTime = b.createdAt?.toMillis?.() || 0
          return aTime - bTime
        })

        // If no galleries exist, create a default one and migrate existing photos
        if (galleriesData.length === 0 && !hasCreatedDefault) {
          hasCreatedDefault = true
          console.log('No galleries found, creating default gallery...')
          const defaultGallery = await createDefaultGallery(userId)
          if (defaultGallery) {
            // The onSnapshot will fire again with the new gallery
            return
          }
        }

        setGalleries(galleriesData)

        // Set current gallery to first one if not set or if current doesn't exist
        if (galleriesData.length > 0) {
          const currentExists = galleriesData.some(g => g.id === currentGalleryId)
          if (!currentGalleryId || !currentExists) {
            setCurrentGalleryId(galleriesData[0].id)
          }
        }

        setIsLoaded(true)
      },
      (error) => {
        console.error('Error fetching galleries:', error)
        setIsLoaded(true)
      }
    )

    return () => unsubscribe()
  }, [userId])

  const createDefaultGallery = async (uid) => {
    try {
      console.log('Creating default gallery for user:', uid)
      const galleryData = {
        userId: uid,
        name: DEFAULT_GALLERY_NAME,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'galleries'), galleryData)
      console.log('Default gallery created with id:', docRef.id)

      // Migrate existing photos to this gallery
      await migrateExistingPhotos(uid, docRef.id)

      return { id: docRef.id, ...galleryData }
    } catch (error) {
      console.error('Failed to create default gallery:', error)
      return null
    }
  }

  const migrateExistingPhotos = async (uid, galleryId) => {
    try {
      console.log('Migrating photos for user:', uid, 'to gallery:', galleryId)
      // Find all photos for this user
      const photosQuery = query(
        collection(db, 'photos'),
        where('userId', '==', uid)
      )

      const snapshot = await getDocs(photosQuery)
      console.log('Found', snapshot.docs.length, 'total photos')

      const batch = writeBatch(db)
      let migratedCount = 0

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        // Only update if galleryId is not set
        if (!data.galleryId) {
          console.log('Migrating photo:', docSnapshot.id)
          batch.update(doc(db, 'photos', docSnapshot.id), { galleryId })
          migratedCount++
        }
      })

      if (migratedCount > 0) {
        await batch.commit()
        console.log(`Successfully migrated ${migratedCount} photos to default gallery`)
      } else {
        console.log('No photos needed migration')
      }
    } catch (error) {
      console.error('Failed to migrate photos:', error)
    }
  }

  const createGallery = useCallback(async (name) => {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Must be logged in to create galleries')
    }

    try {
      const galleryData = {
        userId: user.uid,
        name: name.trim(),
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'galleries'), galleryData)
      return docRef.id
    } catch (error) {
      console.error('Failed to create gallery:', error)
      throw error
    }
  }, [])

  const renameGallery = useCallback(async (id, newName) => {
    try {
      const galleryRef = doc(db, 'galleries', id)
      await updateDoc(galleryRef, { name: newName.trim() })
    } catch (error) {
      console.error('Failed to rename gallery:', error)
      throw error
    }
  }, [])

  const deleteGallery = useCallback(async (id) => {
    // Don't allow deleting the last gallery
    if (galleries.length <= 1) {
      throw new Error('Cannot delete the only gallery')
    }

    try {
      // Delete all photos in this gallery first
      const photosQuery = query(
        collection(db, 'photos'),
        where('galleryId', '==', id)
      )

      const snapshot = await getDocs(photosQuery)
      const batch = writeBatch(db)

      snapshot.docs.forEach((docSnapshot) => {
        batch.delete(doc(db, 'photos', docSnapshot.id))
      })

      // Delete the gallery
      batch.delete(doc(db, 'galleries', id))

      await batch.commit()

      // Switch to another gallery if we deleted the current one
      if (currentGalleryId === id) {
        const remainingGallery = galleries.find(g => g.id !== id)
        if (remainingGallery) {
          setCurrentGalleryId(remainingGallery.id)
        }
      }
    } catch (error) {
      console.error('Failed to delete gallery:', error)
      throw error
    }
  }, [galleries, currentGalleryId])

  const selectGallery = useCallback((id) => {
    setCurrentGalleryId(id)
  }, [])

  const currentGallery = galleries.find(g => g.id === currentGalleryId) || null

  return {
    galleries,
    currentGallery,
    currentGalleryId,
    isLoaded,
    createGallery,
    renameGallery,
    deleteGallery,
    selectGallery,
  }
}
