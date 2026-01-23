const DEFAULT_MAX_DIMENSION = 1920
const DEFAULT_QUALITY = 0.8

export async function compressImage(file, options = {}) {
  const {
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
    outputType = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      try {
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxDimension
        )

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            const compressedFile = new File(
              [blob],
              getOutputFilename(file.name, outputType),
              { type: outputType }
            )

            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
              width,
              height,
              originalWidth: img.width,
              originalHeight: img.height,
            })
          },
          outputType,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export function calculateDimensions(width, height, maxDimension) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  const aspectRatio = width / height

  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    }
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    }
  }
}

export function getOutputFilename(originalName, outputType) {
  const baseName = originalName.replace(/\.[^.]+$/, '')
  const extension = outputType === 'image/png' ? 'png' : 'jpg'
  return `${baseName}.${extension}`
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
