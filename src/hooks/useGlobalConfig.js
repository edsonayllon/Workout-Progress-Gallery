import { useState, useEffect, useCallback } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../firebase'

export const DEFAULT_CONFIG = {
  unitSystem: 'imperial', // 'imperial' or 'metric'
  measurements: ['Waist', 'Chest', 'Arms'], // Default measurement labels
  ratios: [], // Array of { name, numerator, denominator }
}

export function useGlobalConfig() {
  const [globalConfig, setGlobalConfig] = useState(DEFAULT_CONFIG)
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState(null)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null)
    })
    return () => unsubscribe()
  }, [])

  // Subscribe to global config document
  useEffect(() => {
    if (!userId) {
      setGlobalConfig(DEFAULT_CONFIG)
      setIsLoaded(true)
      return
    }

    const configRef = doc(db, 'userSettings', userId)

    const unsubscribe = onSnapshot(
      configRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setGlobalConfig({
            unitSystem: data.unitSystem || DEFAULT_CONFIG.unitSystem,
            measurements: data.measurements || DEFAULT_CONFIG.measurements,
            ratios: data.ratios || DEFAULT_CONFIG.ratios,
          })
        } else {
          // No config exists yet, use defaults
          setGlobalConfig(DEFAULT_CONFIG)
        }
        setIsLoaded(true)
      },
      (error) => {
        console.error('Error fetching global config:', error)
        setGlobalConfig(DEFAULT_CONFIG)
        setIsLoaded(true)
      }
    )

    return () => unsubscribe()
  }, [userId])

  const updateGlobalConfig = useCallback(async (config) => {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Must be logged in to update settings')
    }

    try {
      const configRef = doc(db, 'userSettings', user.uid)
      await setDoc(configRef, {
        unitSystem: config.unitSystem,
        measurements: config.measurements,
        ratios: config.ratios || [],
        updatedAt: new Date(),
      }, { merge: true })
    } catch (error) {
      console.error('Failed to update global config:', error)
      throw error
    }
  }, [])

  return {
    globalConfig,
    isLoaded,
    updateGlobalConfig,
  }
}

// Helper function to merge global and gallery configs
export function mergeConfigs(globalConfig, galleryConfig) {
  // If gallery has no config override, use global
  if (!galleryConfig) {
    return { ...globalConfig, isInherited: true }
  }

  // Gallery config overrides global
  return {
    unitSystem: galleryConfig.unitSystem ?? globalConfig.unitSystem,
    measurements: galleryConfig.measurements ?? globalConfig.measurements,
    ratios: galleryConfig.ratios ?? globalConfig.ratios ?? [],
    isInherited: false,
  }
}
