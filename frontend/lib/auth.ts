import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'simondu-web-secret-key-2024-polda-jabar'
const JWT_ALGORITHM = 'HS256'
const JWT_EXPIRATION = '8h' // 480 minutes

export interface TokenPayload {
  user_id: string
  email: string
  role: string
  unit_id?: string
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM as jwt.Algorithm,
    expiresIn: JWT_EXPIRATION
  })
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM as jwt.Algorithm]
    }) as TokenPayload
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

export function getCurrentUser(request: NextRequest): TokenPayload {
  const token = getTokenFromRequest(request)
  if (!token) {
    throw new Error('No authorization token provided')
  }
  return verifyToken(token)
}
