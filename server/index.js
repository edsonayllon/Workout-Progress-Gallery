import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync, existsSync } from 'fs'

import { config } from './config.js'
import authRoutes from './routes/auth.js'
import photoRoutes from './routes/photos.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Ensure data directory exists
const dataDir = join(__dirname, '../data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// Ensure uploads directory exists
const uploadsDir = join(__dirname, 'uploads')
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true })
}

const app = express()

// Middleware
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())

// Serve uploaded files
app.use('/api/uploads', express.static(uploadsDir))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/photos', photoRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
})
