import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config.js'
import { challengeQueries, userQueries, credentialQueries } from '../db/database.js'

const CHALLENGE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

function storeChallenge(challenge, type, userId = null) {
  const id = uuidv4()
  const expiresAt = new Date(Date.now() + CHALLENGE_TIMEOUT).toISOString()
  challengeQueries.create.run(id, challenge, type, userId, expiresAt)
  return id
}

function getAndDeleteChallenge(challengeId) {
  const record = challengeQueries.findById.get(challengeId)
  if (!record) return null

  challengeQueries.delete.run(challengeId)

  // Check if expired
  if (new Date(record.expires_at) < new Date()) {
    return null
  }

  return record
}

export async function getRegistrationOptions() {
  // Generate a new user ID for registration
  const userId = uuidv4()
  // Use a placeholder name - user can set display name later
  const displayName = 'User'

  const options = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userID: new TextEncoder().encode(userId),
    userName: userId, // Use ID as username for uniqueness
    userDisplayName: displayName,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
    supportedAlgorithmIDs: [-7, -257], // ES256, RS256
  })

  const challengeId = storeChallenge(options.challenge, 'registration', userId)

  return {
    options,
    challengeId,
    userId,
  }
}

export async function verifyRegistration(challengeId, userId, response) {
  const challengeRecord = getAndDeleteChallenge(challengeId)
  if (!challengeRecord) {
    throw new Error('Challenge expired or invalid')
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challengeRecord.challenge,
    expectedOrigin: config.allowedOrigins,
    expectedRPID: config.rpID,
  })

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Registration verification failed')
  }

  const { registrationInfo } = verification
  console.log('Registration info:', JSON.stringify(registrationInfo, null, 2))

  // v10 API: credential info is directly on registrationInfo
  const credentialId = registrationInfo.credential?.id || registrationInfo.credentialID
  const publicKey = registrationInfo.credential?.publicKey || registrationInfo.credentialPublicKey
  const counter = registrationInfo.credential?.counter ?? registrationInfo.counter ?? 0

  if (!credentialId || !publicKey) {
    console.error('Missing credential data:', registrationInfo)
    throw new Error('Invalid credential data from registration')
  }

  // Create user with null username (can be set later)
  userQueries.create.run(userId, null)

  // Store credential
  const transports = response.response.transports || ['internal', 'hybrid']
  credentialQueries.create.run(
    credentialId,
    userId,
    Buffer.from(publicKey).toString('base64'),
    counter,
    JSON.stringify(transports)
  )

  const user = userQueries.findById.get(userId)
  return { userId, username: user.username }
}

export async function getAuthenticationOptions() {
  // For discoverable credentials, we don't specify allowCredentials
  // The browser will show all available passkeys for this site
  const options = await generateAuthenticationOptions({
    rpID: config.rpID,
    userVerification: 'preferred',
    // Empty allowCredentials enables discoverable credential flow
    allowCredentials: [],
  })

  const challengeId = storeChallenge(options.challenge, 'authentication', null)

  return {
    options,
    challengeId,
  }
}

export async function verifyAuthentication(challengeId, response) {
  const challengeRecord = getAndDeleteChallenge(challengeId)
  if (!challengeRecord) {
    throw new Error('Challenge expired or invalid')
  }

  // Find credential by ID from the response
  const credential = credentialQueries.findById.get(response.id)
  if (!credential) {
    throw new Error('Credential not found')
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challengeRecord.challenge,
    expectedOrigin: config.allowedOrigins,
    expectedRPID: config.rpID,
    credential: {
      id: credential.id,
      publicKey: Buffer.from(credential.public_key, 'base64'),
      counter: credential.counter,
      transports: JSON.parse(credential.transports || '["internal", "hybrid"]'),
    },
  })

  if (!verification.verified) {
    throw new Error('Authentication verification failed')
  }

  // Update counter
  credentialQueries.updateCounter.run(
    verification.authenticationInfo.newCounter,
    credential.id
  )

  const user = userQueries.findById.get(credential.user_id)
  return { userId: user.id, username: user.username }
}
