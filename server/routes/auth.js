import { Router } from 'express'
import {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
} from '../services/webauthn.js'
import { createSession, deleteSession, getUserFromSession } from '../services/session.js'
import { userQueries } from '../db/database.js'
import { config } from '../config.js'

const router = Router()

// Get registration options (no username required)
router.post('/register/options', async (req, res) => {
  try {
    const result = await getRegistrationOptions()

    res.json({
      options: result.options,
      challengeId: result.challengeId,
      userId: result.userId,
    })
  } catch (error) {
    console.error('Registration options error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Verify registration
router.post('/register/verify', async (req, res) => {
  try {
    const { challengeId, userId, response } = req.body

    if (!challengeId || !userId || !response) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const result = await verifyRegistration(challengeId, userId, response)

    // Create session
    const session = createSession(result.userId)

    res.cookie('sessionId', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: config.cookieMaxAge,
    })

    res.json({
      success: true,
      user: { id: result.userId, username: result.username },
    })
  } catch (error) {
    console.error('Registration verify error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Get authentication options (no username required - uses discoverable credentials)
router.post('/login/options', async (req, res) => {
  try {
    const result = await getAuthenticationOptions()

    res.json({
      options: result.options,
      challengeId: result.challengeId,
    })
  } catch (error) {
    console.error('Login options error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Verify authentication
router.post('/login/verify', async (req, res) => {
  try {
    const { challengeId, response } = req.body

    if (!challengeId || !response) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const result = await verifyAuthentication(challengeId, response)

    // Create session
    const session = createSession(result.userId)

    res.cookie('sessionId', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: config.cookieMaxAge,
    })

    res.json({
      success: true,
      user: { id: result.userId, username: result.username },
    })
  } catch (error) {
    console.error('Login verify error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Logout
router.post('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId

  if (sessionId) {
    deleteSession(sessionId)
  }

  res.clearCookie('sessionId')
  res.json({ success: true })
})

// Get current user
router.get('/me', (req, res) => {
  const sessionId = req.cookies.sessionId

  if (!sessionId) {
    return res.json({ user: null })
  }

  const user = getUserFromSession(sessionId)

  if (!user) {
    res.clearCookie('sessionId')
    return res.json({ user: null })
  }

  res.json({ user: { id: user.id, username: user.username } })
})

// Update username (requires authentication)
router.patch('/me', (req, res) => {
  const sessionId = req.cookies.sessionId

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = getUserFromSession(sessionId)

  if (!user) {
    res.clearCookie('sessionId')
    return res.status(401).json({ error: 'Session expired' })
  }

  const { username } = req.body

  if (username !== undefined) {
    // Update username (allow null to clear it)
    const trimmed = username ? username.trim() : null

    // Check if username is taken by another user
    if (trimmed) {
      const existing = userQueries.findByUsername.get(trimmed)
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ error: 'Username already taken' })
      }
    }

    userQueries.updateUsername.run(trimmed, user.id)
  }

  const updatedUser = userQueries.findById.get(user.id)
  res.json({ user: { id: updatedUser.id, username: updatedUser.username } })
})

export default router
