import { useState, useEffect } from 'react'
import { usePhotoStorage } from './hooks/usePhotoStorage'
import { PhotoUpload } from './components/PhotoUpload'
import { PhotoViewer } from './components/PhotoViewer'
import { PhotoEditor } from './components/PhotoEditor'
import { Navigation } from './components/Navigation'

function App() {
  const { photos, isLoaded, addPhoto, updatePhoto, deletePhoto } = usePhotoStorage()
  const [currentIndex, setCurrentIndex] = useState(0)

  // Adjust current index if photos array changes
  useEffect(() => {
    if (photos.length === 0) {
      setCurrentIndex(0)
    } else if (currentIndex >= photos.length) {
      setCurrentIndex(photos.length - 1)
    }
  }, [photos.length, currentIndex])

  // Keyboard navigation with arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't navigate if user is typing in an input field
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

  const handleUpload = (photoData) => {
    const newId = addPhoto(photoData)
    // Find the index of the newly added photo after sorting
    const newIndex = photos.findIndex(p => p.id === newId)
    if (newIndex === -1) {
      // Photo was just added, it will be at the end or sorted position
      // Set to last position for now, will update after state settles
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

  const handleDelete = () => {
    if (!currentPhoto) return
    if (confirm('Are you sure you want to delete this photo?')) {
      deletePhoto(currentPhoto.id)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-5">
        <header className="flex justify-between items-center mb-8 pb-5 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Workout Progress Gallery</h1>
          <PhotoUpload onUpload={handleUpload} />
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="flex flex-col">
            <PhotoViewer photo={currentPhoto} previousPhoto={previousPhoto} />
            <Navigation
              currentIndex={currentIndex}
              totalPhotos={photos.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onDelete={handleDelete}
            />
          </div>

          <aside>
            <PhotoEditor photo={currentPhoto} onUpdate={updatePhoto} />
          </aside>
        </main>
      </div>
    </div>
  )
}

export default App
