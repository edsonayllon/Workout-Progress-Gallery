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
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const ext = extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `${uuidv4()}${ext}`)
  },
})

const fileFilter = function (req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']

  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(heic|heif)$/i)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
})
