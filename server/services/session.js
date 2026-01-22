import { v4 as uuidv4 } from 'uuid'
import { sessionQueries, userQueries } from '../db/database.js'
import { config } from '../config.js'

export function createSession(userId) {
  const sessionId = uuidv4()
  const expiresAt = new Date(Date.now() + config.cookieMaxAge).toISOString()

  sessionQueries.create.run(sessionId, userId, expiresAt)

  return { sessionId, expiresAt }
}

export function getSession(sessionId) {
  if (!sessionId) return null

  const session = sessionQueries.findById.get(sessionId)
  if (!session) return null

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    sessionQueries.delete.run(sessionId)
    return null
  }

  return session
}

export function getUserFromSession(sessionId) {
  const session = getSession(sessionId)
  if (!session) return null

  return userQueries.findById.get(session.user_id)
}

export function deleteSession(sessionId) {
  if (!sessionId) return
  sessionQueries.delete.run(sessionId)
}

export function deleteAllUserSessions(userId) {
  sessionQueries.deleteByUserId.run(userId)
}
