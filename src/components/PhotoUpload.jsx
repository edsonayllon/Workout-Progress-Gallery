import { useRef, useState } from 'react'
import decode from 'heic-decode'
import exifr from 'exifr'
import { compressImage } from '../utils/imageCompression'

export function PhotoUpload({ onUpload }) {
  const fileInputRef = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('')

  const getDateFromExif = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()

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

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    const imageData = new ImageData(new Uint8ClampedArray(data), width, height)
    ctx.putImageData(imageData, 0, 0)

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    })
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const isHeic = fileExtension === 'heic' || fileExtension === 'heif'
    const isImage = file.type.startsWith('image/') || isHeic

    if (!isImage) {
      alert('Please select an image file')
      return
    }

    let fileToProcess = file
    setIsProcessing(true)

    try {
      // Extract date from EXIF metadata (before any conversion)
      setStatus('Reading metadata...')
      const photoDate = await getDateFromExif(file)

      // Convert HEIC/HEIF to JPEG first
      if (isHeic) {
        setStatus('Converting HEIC...')
        try {
          const blob = await convertHeicToJpeg(file)
          const baseName = file.name.replace(/\.(heic|heif)$/i, '')
          fileToProcess = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
        } catch (error) {
          console.error('HEIC conversion failed:', error)
          console.log('Using original file as fallback')
          fileToProcess = file
        }
      }

      // Compress the image
      setStatus('Compressing...')
      const result = await compressImage(fileToProcess, {
        maxDimension: 1920,
        quality: 0.8,
      })

      const compressionRatio = ((1 - result.compressedSize / result.originalSize) * 100).toFixed(0)
      console.log(
        `Compressed: ${(result.originalSize / 1024 / 1024).toFixed(1)}MB → ${(result.compressedSize / 1024 / 1024).toFixed(1)}MB (${compressionRatio}% reduction)`
      )

      setStatus('Uploading...')
      await onUpload(result.file, photoDate)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload photo: ' + error.message)
    } finally {
      setIsProcessing(false)
      setStatus('')
      event.target.value = ''
    }
  }

  const handleClick = () => {
    if (!isProcessing) {
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
        disabled={isProcessing}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        {isProcessing ? status || 'Processing...' : '+ Add Photo'}
      </button>
    </div>
  )
}
