import { getUserFromSession } from '../services/session.js'

export function requireAuth(req, res, next) {
  const sessionId = req.cookies.sessionId

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = getUserFromSession(sessionId)

  if (!user) {
    res.clearCookie('sessionId')
    return res.status(401).json({ error: 'Session expired' })
  }

  req.user = user
  next()
}
