import { useState, useRef, useEffect } from 'react'

export function GallerySelector({
  galleries,
  currentGallery,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isRenaming, setIsRenaming] = useState(null)
  const [newName, setNewName] = useState('')
  const [editName, setEditName] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
        setIsCreating(false)
        setIsRenaming(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if ((isCreating || isRenaming) && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating, isRenaming])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return

    try {
      await onCreate(newName)
      setNewName('')
      setIsCreating(false)
    } catch (error) {
      alert('Failed to create gallery')
    }
  }

  const handleRename = async (e, galleryId) => {
    e.preventDefault()
    if (!editName.trim()) return

    try {
      await onRename(galleryId, editName)
      setIsRenaming(null)
      setEditName('')
    } catch (error) {
      alert('Failed to rename gallery')
    }
  }

  const handleDelete = async (galleryId, galleryName) => {
    if (galleries.length <= 1) {
      alert('Cannot delete the only gallery')
      return
    }

    if (confirm(`Delete "${galleryName}" and all its photos? This cannot be undone.`)) {
      try {
        await onDelete(galleryId)
      } catch (error) {
        alert('Failed to delete gallery')
      }
    }
  }

  const startRenaming = (gallery) => {
    setIsRenaming(gallery.id)
    setEditName(gallery.name)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="font-medium text-gray-700 max-w-[120px] sm:max-w-[200px] truncate">
          {currentGallery?.name || 'Select Gallery'}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Galleries</p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {galleries.map((gallery) => (
              <div
                key={gallery.id}
                className={`group flex items-center justify-between px-3 py-2 hover:bg-gray-50 ${
                  gallery.id === currentGallery?.id ? 'bg-green-50' : ''
                }`}
              >
                {isRenaming === gallery.id ? (
                  <form onSubmit={(e) => handleRename(e, gallery.id)} className="flex-1 flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Gallery name"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRenaming(null)}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onSelect(gallery.id)
                        setIsOpen(false)
                      }}
                      className="flex-1 text-left text-sm text-gray-700 truncate"
                    >
                      {gallery.id === currentGallery?.id && (
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      )}
                      {gallery.name}
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startRenaming(gallery)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Rename"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {galleries.length > 1 && (
                        <button
                          onClick={() => handleDelete(gallery.id, gallery.name)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-2 px-3">
            {isCreating ? (
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="New gallery name"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false)
                    setNewName('')
                  }}
                  className="px-2 py-1.5 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Gallery
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
