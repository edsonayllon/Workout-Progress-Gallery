import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../index.js'
import { createTestUser, createTestSession, createTestPhoto } from './setup.js'
import { photoQueries, userQueries } from '../db/database.js'
import { v4 as uuidv4 } from 'uuid'

describe('API Endpoints', () => {
  let app

  beforeEach(() => {
    app = createApp()
  })

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ status: 'ok' })
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return null user when not authenticated', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ user: null })
    })

    it('should return user when authenticated', async () => {
      const user = createTestUser('testuser')
      const sessionId = createTestSession(user.id)

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `sessionId=${sessionId}`)

      expect(res.status).toBe(200)
      expect(res.body.user.id).toBe(user.id)
      expect(res.body.user.username).toContain('testuser')
    })

    it('should clear cookie and return null for invalid session', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'sessionId=invalid-session-id')

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ user: null })
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should clear session cookie', async () => {
      const user = createTestUser()
      const sessionId = createTestSession(user.id)

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `sessionId=${sessionId}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true })
    })

    it('should succeed even without session', async () => {
      const res = await request(app).post('/api/auth/logout')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true })
    })
  })

  describe('PATCH /api/auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .patch('/api/auth/me')
        .send({ username: 'newname' })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Not authenticated')
    })

    it('should update username when authenticated', async () => {
      const user = createTestUser()
      const sessionId = createTestSession(user.id)
      const newUsername = `updated_${uuidv4().slice(0, 8)}`

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({ username: newUsername })

      expect(res.status).toBe(200)
      expect(res.body.user.username).toBe(newUsername)
    })

    it('should reject duplicate username', async () => {
      const user1 = createTestUser('existing')
      const user2 = createTestUser()
      const sessionId = createTestSession(user2.id)

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({ username: user1.username })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Username already taken')
    })

    it('should allow setting username to null', async () => {
      const user = createTestUser('hasusername')
      const sessionId = createTestSession(user.id)

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({ username: null })

      expect(res.status).toBe(200)
      expect(res.body.user.username).toBeNull()
    })
  })

  describe('GET /api/photos', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/photos')
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Not authenticated')
    })

    it('should return empty array when user has no photos', async () => {
      const user = createTestUser()
      const sessionId = createTestSession(user.id)

      const res = await request(app)
        .get('/api/photos')
        .set('Cookie', `sessionId=${sessionId}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it('should return user photos sorted by date', async () => {
      const user = createTestUser()
      const sessionId = createTestSession(user.id)

      createTestPhoto(user.id, 'photo2.jpg', '2024-02-01')
      createTestPhoto(user.id, 'photo1.jpg', '2024-01-01')
      createTestPhoto(user.id, 'photo3.jpg', '2024-03-01')

      const res = await request(app)
        .get('/api/photos')
        .set('Cookie', `sessionId=${sessionId}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(3)
      expect(res.body[0].date).toBe('2024-01-01')
      expect(res.body[1].date).toBe('2024-02-01')
      expect(res.body[2].date).toBe('2024-03-01')
    })

    it('should not return other users photos', async () => {
      const user1 = createTestUser()
      const user2 = createTestUser()
      const sessionId = createTestSession(user1.id)

      createTestPhoto(user1.id, 'myPhoto.jpg', '2024-01-01')
      createTestPhoto(user2.id, 'otherPhoto.jpg', '2024-01-01')

      const res = await request(app)
        .get('/api/photos')
        .set('Cookie', `sessionId=${sessionId}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].src).toContain('myPhoto.jpg')
    })
  })

  describe('POST /api/photos', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/photos')
      expect(res.status).toBe(401)
    })

    it('should return 400 when no file is provided', async () => {
      const user = createTestUser()
      const sessionId = createTestSession(user.id)

      const res = await request(app)
        .post('/api/photos')
        .set('Cookie', `sessionId=${sessionId}`)

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('No photo uploaded')
    })

    it('should upload a photo successfully', async () => {
      const user = createTestUser()
      const sessionId = createTestSession(user.id)

      // Minimal valid JPEG (1x1 pixel)
      const testImageBuffer = Buffer.from(
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==',
        'base64'
      )

      const res = await request(app)
        .post('/api/photos')
        .set('Cookie', `sessionId=${sessionId}`)
        .attach('photo', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
        .field('date', '2024-01-15')

      expect(res.status).toBe(201)
      expect(res.body.id).toBeDefined()
      expect(res.body.date).toBe('2024-01-15')
      expect(res.body.src).toContain('/api/uploads/')
      expect(res.body.measurements).toBeDefined()
    })
  })

  describe('PATCH /api/photos/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .patch('/api/photos/some-id')
        .send({ date: '2024-01-01' })

      expect(res.status).toBe(401)
    })

    it('should return 404 for non-existent photo', async () => {
      const user = createTestUser()
      const sessionId = createTestSession(user.id)

      const res = await request(app)
        .patch('/api/photos/non-existent-id')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({ date: '2024-01-01' })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Photo not found')
    })

    it('should return 403 when updating another user photo', async () => {
      const user1 = createTestUser()
      const user2 = createTestUser()
      const sessionId = createTestSession(user2.id)
      const photoId = createTestPhoto(user1.id, 'other.jpg', '2024-01-01')

      const res = await request(app)
        .patch(`/api/photos/${photoId}`)
        .set('Cookie', `sessionId=${sessionId}`)
        .send({ date: '2024-02-01' })

      expect(res.status).toBe(403)
      expect(res.body.error).toBe('Not authorized')
    })

    it('should update photo metadata', async () => {
      const user = createTestUser()
      const sessionId = createTestSession(user.id)
      const photoId = createTestPhoto(user.id, 'mine.jpg', '2024-01-01')

      const res = await request(app)
        .patch(`/api/photos/${photoId}`)
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          date: '2024-02-15',
          weight: 75.5,
          measurements: [{ label: 'Waist', value: 32 }],
        })

      expect(res.status).toBe(200)
      expect(res.body.date).toBe('2024-02-15')
      expect(res.body.weight).toBe(75.5)
      expect(res.body.measurements).toEqual([{ label: 'Waist', value: 32 }])
    })
  })

  describe('DELETE /api/photos/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/photos/some-id')
      expect(res.status).toBe(401)
    })

    it('should return 404 for non-existent photo', async () => {
      const user = createTestUser()
      const sessionId = createTestSession(user.id)

      const res = await request(app)
        .delete('/api/photos/non-existent-id')
        .set('Cookie', `sessionId=${sessionId}`)

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Photo not found')
    })

    it('should return 403 when deleting another user photo', async () => {
      const user1 = createTestUser()
      const user2 = createTestUser()
      const sessionId = createTestSession(user2.id)
      const photoId = createTestPhoto(user1.id, 'other.jpg', '2024-01-01')

      const res = await request(app)
        .delete(`/api/photos/${photoId}`)
        .set('Cookie', `sessionId=${sessionId}`)

      expect(res.status).toBe(403)
      expect(res.body.error).toBe('Not authorized')
    })

    it('should delete photo successfully', async () => {
      const user = createTestUser()
      const sessionId = createTestSession(user.id)
      const photoId = createTestPhoto(user.id, 'todelete.jpg', '2024-01-01')

      const res = await request(app)
        .delete(`/api/photos/${photoId}`)
        .set('Cookie', `sessionId=${sessionId}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true })

      // Verify it's deleted
      const photo = photoQueries.findById.get(photoId)
      expect(photo).toBeUndefined()
    })
  })
})
