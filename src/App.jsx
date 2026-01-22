import { useState, useEffect, useRef } from 'react'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import { usePhotoStorage } from './hooks/usePhotoStorage'
import { PhotoUpload } from './components/PhotoUpload'
import { PhotoViewer } from './components/PhotoViewer'
import { PhotoEditor } from './components/PhotoEditor'
import { Navigation } from './components/Navigation'
import { AuthScreen } from './components/AuthScreen'

function UserMenu() {
  const { user, logout, updateUsername } = useAuthContext()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(user?.username || '')
  const [isSaving, setIsSaving] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
        setIsEditingName(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update nameValue when user changes
  useEffect(() => {
    setNameValue(user?.username || '')
  }, [user?.username])

  const handleSaveName = async () => {
    setIsSaving(true)
    try {
      await updateUsername(nameValue.trim() || null)
      setIsEditingName(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      setNameValue(user?.username || '')
      setIsEditingName(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
        title="User settings"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Account</p>
          </div>

          <div className="px-4 py-3">
            <label className="text-sm text-gray-600 block mb-1">Display Name</label>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter name"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  autoFocus
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  {isSaving ? '...' : 'Save'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-sm text-gray-800 hover:text-blue-500 flex items-center gap-1"
              >
                {user?.username || <span className="text-gray-400 italic">Not set</span>}
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          <div className="border-t border-gray-100 mt-1 pt-1">
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

  const handleUpload = async (file, date) => {
    const newId = await addPhoto(file, date)
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

  const handleDelete = async () => {
    if (!currentPhoto) return
    if (confirm('Are you sure you want to delete this photo?')) {
      await deletePhoto(currentPhoto.id)
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
          <div className="flex items-center gap-3">
            <UserMenu />
            <h1 className="text-2xl font-semibold text-gray-800">Physical Progress</h1>
          </div>
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

function AppContent() {
  const { isLoading, isAuthenticated } = useAuthContext()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">
        Loading...
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
