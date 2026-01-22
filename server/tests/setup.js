import { v4 as uuidv4 } from 'uuid'
import { userQueries, sessionQueries, photoQueries } from '../db/database.js'
import { config } from '../config.js'

// Helper to create a test user with a unique username
export function createTestUser(usernamePrefix = null) {
  const userId = uuidv4()
  // Make username unique by appending UUID if prefix provided
  const username = usernamePrefix ? `${usernamePrefix}_${uuidv4().slice(0, 8)}` : null
  userQueries.create.run(userId, username)
  return { id: userId, username }
}

// Helper to create a session for a user
export function createTestSession(userId) {
  const sessionId = uuidv4()
  const expiresAt = new Date(Date.now() + config.cookieMaxAge).toISOString()
  sessionQueries.create.run(sessionId, userId, expiresAt)
  return sessionId
}

// Helper to create a test photo entry
export function createTestPhoto(userId, filename = 'test.jpg', date = '2024-01-01') {
  const photoId = uuidv4()
  const measurements = JSON.stringify([
    { label: 'Waist', value: null },
    { label: 'Shoulders', value: null },
  ])
  photoQueries.create.run(photoId, userId, filename, date, null, measurements)
  return photoId
}
