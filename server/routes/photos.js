import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { requireAuth } from '../middleware/auth.js'
import { upload, uploadsDir } from '../middleware/upload.js'
import { photoQueries } from '../db/database.js'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// List user's photos
router.get('/', (req, res) => {
  try {
    const photos = photoQueries.findByUserId.all(req.user.id)

    const formattedPhotos = photos.map(photo => ({
      id: photo.id,
      src: `/api/uploads/${photo.filename}`,
      date: photo.date,
      weight: photo.weight,
      measurements: photo.measurements ? JSON.parse(photo.measurements) : null,
    }))

    res.json(formattedPhotos)
  } catch (error) {
    console.error('List photos error:', error)
    res.status(500).json({ error: 'Failed to list photos' })
  }
})

// Upload a new photo - use middleware pattern for multer
router.post(
  '/',
  (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err)
        return res.status(400).json({ error: err.message || 'Upload failed' })
      }
      next()
    })
  },
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' })
      }

      const id = uuidv4()
      const date = req.body.date || new Date().toISOString().split('T')[0]
      const weight = req.body.weight ? parseFloat(req.body.weight) : null
      const measurements = req.body.measurements || JSON.stringify([
        { label: 'Waist', value: null },
        { label: 'Shoulders', value: null },
      ])

      photoQueries.create.run(
        id,
        req.user.id,
        req.file.filename,
        date,
        weight,
        measurements
      )

      res.status(201).json({
        id,
        src: `/api/uploads/${req.file.filename}`,
        date,
        weight,
        measurements: JSON.parse(measurements),
      })
    } catch (error) {
      console.error('Upload photo error:', error)
      res.status(500).json({ error: error.message || 'Failed to upload photo' })
    }
  }
)

// Update photo metadata
router.patch('/:id', (req, res) => {
  try {
    const photo = photoQueries.findById.get(req.params.id)

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' })
    }

    if (photo.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const date = req.body.date ?? photo.date
    const weight = req.body.weight !== undefined ? req.body.weight : photo.weight
    const measurements = req.body.measurements
      ? JSON.stringify(req.body.measurements)
      : photo.measurements

    photoQueries.update.run(date, weight, measurements, req.params.id, req.user.id)

    res.json({
      id: photo.id,
      src: `/api/uploads/${photo.filename}`,
      date,
      weight,
      measurements: measurements ? JSON.parse(measurements) : null,
    })
  } catch (error) {
    console.error('Update photo error:', error)
    res.status(500).json({ error: 'Failed to update photo' })
  }
})

// Delete photo
router.delete('/:id', async (req, res) => {
  try {
    const photo = photoQueries.findById.get(req.params.id)

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' })
    }

    if (photo.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Delete file from disk
    try {
      await unlink(join(uploadsDir, photo.filename))
    } catch (err) {
      console.error('Failed to delete file:', err)
    }

    // Delete from database
    photoQueries.delete.run(req.params.id, req.user.id)

    res.json({ success: true })
  } catch (error) {
    console.error('Delete photo error:', error)
    res.status(500).json({ error: 'Failed to delete photo' })
  }
})

export default router
