import { useState, useEffect, useRef } from 'react'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import { usePhotoStorage } from './hooks/usePhotoStorage'
import { useGalleries } from './hooks/useGalleries'
import { useGlobalConfig, mergeConfigs } from './hooks/useGlobalConfig'
import { useImagePreloader } from './hooks/useImagePreloader'
import { PhotoUpload } from './components/PhotoUpload'
import { PhotoViewer } from './components/PhotoViewer'
import { PhotoEditor } from './components/PhotoEditor'
import { Navigation } from './components/Navigation'
import { AuthScreen } from './components/AuthScreen'
import { GallerySelector } from './components/GallerySelector'
import { GallerySettings } from './components/GallerySettings'
import { GlobalSettings } from './components/GlobalSettings'

function UserMenu({ onGlobalSettings }) {
  const { user, logout } = useAuthContext()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-blue-500 hover:ring-2 hover:ring-blue-300 transition-all flex-shrink-0"
        title="User settings"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.displayName || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                onGlobalSettings()
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Default Settings
            </button>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Gallery() {
  const {
    galleries,
    currentGallery,
    currentGalleryId,
    isLoaded: galleriesLoaded,
    createGallery,
    renameGallery,
    updateGalleryConfig,
    clearGalleryConfig,
    deleteGallery,
    selectGallery,
  } = useGalleries()

  const { globalConfig, isLoaded: globalConfigLoaded, updateGlobalConfig } = useGlobalConfig()
  const { photos: unsortedPhotos, isLoaded: photosLoaded, addPhoto, updatePhoto, deletePhoto } = usePhotoStorage(currentGalleryId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false)

  const isLoaded = galleriesLoaded && photosLoaded && globalConfigLoaded

  // Merge global config with gallery-specific overrides
  const effectiveConfig = mergeConfigs(globalConfig, currentGallery?.config)

  // Sort photos based on config
  const photos = [...unsortedPhotos].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return effectiveConfig.sortOrder === 'reverseChronological'
      ? dateB - dateA
      : dateA - dateB
  })

  // Preload adjacent images for faster navigation
  useImagePreloader(photos, currentIndex, 2)

  // Reset index when gallery changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [currentGalleryId])

  useEffect(() => {
    if (photos.length === 0) {
      setCurrentIndex(0)
    } else if (currentIndex >= photos.length) {
      setCurrentIndex(photos.length - 1)
    }
  }, [photos.length, currentIndex])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, photos.length])

  const currentPhoto = photos[currentIndex] || null
  const previousPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null

  const handleUpload = async (file, date) => {
    const newId = await addPhoto(file, date)
    const newIndex = photos.findIndex(p => p.id === newId)
    if (newIndex === -1) {
      setCurrentIndex(photos.length)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleDelete = async () => {
    if (!currentPhoto) return
    if (confirm('Are you sure you want to delete this photo?')) {
      await deletePhoto(currentPhoto.id)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-gray-500 text-lg">Loading gallery...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 py-4 sm:p-5">
        <header className="flex flex-col gap-3 mb-4 sm:mb-8 pb-4 sm:pb-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <UserMenu onGlobalSettings={() => setIsGlobalSettingsOpen(true)} />
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-800">Physical Progress</h1>
            </div>
            <PhotoUpload onUpload={handleUpload} />
          </div>
          <div className="flex items-center">
            <GallerySelector
              galleries={galleries}
              currentGallery={currentGallery}
              onSelect={selectGallery}
              onCreate={createGallery}
              onSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4 sm:gap-8">
          <div className="flex flex-col">
            <PhotoViewer
              photo={currentPhoto}
              previousPhoto={previousPhoto}
              onNext={handleNext}
              onPrevious={handlePrevious}
              hasPrevious={currentIndex > 0}
              hasNext={currentIndex < photos.length - 1}
              galleryConfig={effectiveConfig}
            />
            <Navigation
              currentIndex={currentIndex}
              totalPhotos={photos.length}
            />
          </div>

          <aside>
            <PhotoEditor photo={currentPhoto} onUpdate={updatePhoto} onDelete={handleDelete} galleryConfig={effectiveConfig} />
          </aside>
        </main>
      </div>

      {isSettingsOpen && currentGallery && (
        <GallerySettings
          gallery={currentGallery}
          globalConfig={globalConfig}
          galleryCount={galleries.length}
          onUpdate={updateGalleryConfig}
          onClear={clearGalleryConfig}
          onRename={renameGallery}
          onDelete={deleteGallery}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isGlobalSettingsOpen && (
        <GlobalSettings
          config={globalConfig}
          onUpdate={updateGlobalConfig}
          onClose={() => setIsGlobalSettingsOpen(false)}
        />
      )}
    </div>
  )
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuthContext()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-gray-500 text-lg">Loading...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return <Gallery />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
