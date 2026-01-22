import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { mkdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const uploadsDir = resolve(__dirname, '../uploads')

// Ensure uploads directory exists
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file) => {
    const ext = extname(file.originalname).toLowerCase() || '.jpg'
    return `${uuidv4()}${ext}`
  },
})

const fileFilter = (req, file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']

  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(heic|heif)$/i)) {
    return true
  }
  throw new Error('Invalid file type. Only images are allowed.')
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
})
