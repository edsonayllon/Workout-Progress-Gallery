import { useRef, useState } from 'react'
import decode from 'heic-decode'
import exifr from 'exifr'

export function PhotoUpload({ onUpload }) {
  const fileInputRef = useRef(null)
  const [isConverting, setIsConverting] = useState(false)

  const getDateFromExif = async (file) => {
    try {
      // Read file as ArrayBuffer for better compatibility
      const arrayBuffer = await file.arrayBuffer()

      // Try parsing with HEIC/TIFF support enabled
      const exif = await exifr.parse(arrayBuffer, {
        tiff: true,
        ifd0: true,
        exif: true,
        gps: false,
        pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate']
      })

      const date = exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate
      if (date instanceof Date) {
        return date.toISOString().split('T')[0]
      }
    } catch (error) {
      console.log('Could not read EXIF date:', error)

      // Fallback: try to get date from file's lastModified
      if (file.lastModified) {
        return new Date(file.lastModified).toISOString().split('T')[0]
      }
    }
    return new Date().toISOString().split('T')[0]
  }

  const convertHeicToJpeg = async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const { width, height, data } = await decode({ buffer: uint8Array })

    // Create canvas and draw the decoded image data
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    // Create ImageData from the decoded RGBA data
    const imageData = new ImageData(new Uint8ClampedArray(data), width, height)
    ctx.putImageData(imageData, 0, 0)

    // Convert canvas to JPEG blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    })
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Check file extension for HEIC (more reliable than MIME type)
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const isHeic = fileExtension === 'heic' || fileExtension === 'heif'

    // Check for valid image types
    const isImage = file.type.startsWith('image/') || isHeic

    if (!isImage) {
      alert('Please select an image file')
      return
    }

    let fileToUpload = file
    setIsConverting(true)

    // Extract date from EXIF metadata (before any conversion)
    const photoDate = await getDateFromExif(file)

    // Convert HEIC/HEIF to JPEG
    if (isHeic) {
      try {
        const blob = await convertHeicToJpeg(file)
        // Create a new File from the blob with .jpg extension
        const baseName = file.name.replace(/\.(heic|heif)$/i, '')
        fileToUpload = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
      } catch (error) {
        console.error('HEIC conversion failed:', error)
        // Fallback to original file (works in Safari)
        console.log('Using original file as fallback')
        fileToUpload = file
      }
    }

    setIsConverting(false)

    // Upload file directly to the server
    try {
      await onUpload(fileToUpload, photoDate)
    } catch (error) {
      alert('Failed to upload photo: ' + error.message)
    }

    // Reset input so same file can be uploaded again
    event.target.value = ''
  }

  const handleClick = () => {
    if (!isConverting) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={isConverting}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        {isConverting ? 'Converting...' : '+ Add Photo'}
      </button>
    </div>
  )
}
