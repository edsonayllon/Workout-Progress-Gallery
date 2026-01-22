import 'dotenv/config'

// In development, allow any localhost origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
]

export const config = {
  port: process.env.PORT || 3001,
  rpName: process.env.RP_NAME || 'Workout Progress Gallery',
  rpID: process.env.RP_ID || 'localhost',
  origin: process.env.ORIGIN || 'http://localhost:5173',
  allowedOrigins: process.env.NODE_ENV === 'production'
    ? [process.env.ORIGIN]
    : allowedOrigins,
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}
