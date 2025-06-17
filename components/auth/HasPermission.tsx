Replace the jsonwebtoken dependency with a custom JWT implementation using native Node.js crypto. Update package.json to remove jsonwebtoken and replace lib/auth.ts with this version:

\`\`\`typescript
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from './db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export interface User {
  id: number
  name: string
  email: string
  roles: string[]
  permissions: string[]
  isActive: boolean
}

// Simple JWT implementation using Node.js crypto
class SimpleJWT {
  private secret: string

  constructor(secret: string) {
    this.secret = secret
  }

  sign(payload: any, expiresIn: string = '7d'): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + (7 * 24 * 60 * 60) // 7 days in seconds

    const jwtPayload = {
      ...payload,
      iat: now,
      exp: exp
    }

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(jwtPayload))
    
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`)
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  verify(token: string): any {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.')
      
      if (!encodedHeader || !encodedPayload || !signature) {
        throw new Error('Invalid token format')
      }

      // Verify signature
      const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`)
      if (signature !== expectedSignature) {
        throw new Error('Invalid signature')
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload))
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired')
      }

      return payload
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  private base64UrlDecode(str: string): string {
    str += '='.repeat((4 - str.length % 4) % 4)
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
  }

  private createSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-minimum-32-characters-long-not-for-production'
const jwt = new SimpleJWT(JWT_SECRET)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createAuthToken(userId: number): Promise<string> {
  return jwt.sign({ userId }, '7d')
}

export async function getUserWithRoles(userId: number): Promise<User | null> {
  try {
    const [user] = await sql`
      SELECT 
        u.id, u.name, u.email, u.is_active,
        COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) as roles,
        COALESCE(array_agg(DISTINCT p.permission) FILTER (WHERE p.permission IS NOT NULL), ARRAY[]::text[]) as permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN LATERAL jsonb_array_elements_text(r.permissions) p(permission) ON true
      WHERE u.id = ${userId} AND u.is_active = true
      GROUP BY u.id, u.name, u.email, u.is_active
    `

    if (!user) return null

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles || [],
      permissions: user.permissions || [],
      isActive: user.is_active
    }
  } catch (error) {
    console.error('Error fetching user with roles:', error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = cookies().get('auth_token')?.value
    if (!token) return null

    const payload = jwt.verify(token)
    const user = await getUserWithRoles(payload.userId)
    
    return user
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export function hasPermission(user: User, permission: string): boolean {
  if (user.permissions.includes('*')) return true
  return user.permissions.includes(permission)
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const [user] = await sql`
      SELECT id, name, email, password, is_active
      FROM users
      WHERE email = ${email} AND is_active = true
    `

    if (!user) return null

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) return null

    await sql`
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `

    return getUserWithRoles(user.id)
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export async function logAction(
  userId: number,
  action: string,
  tableName: string,
  recordId?: number,
  oldValues?: any,
  newValues?: any
) {
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
      VALUES (${userId}, ${action}, ${tableName}, ${recordId || null}, 
              ${oldValues ? JSON.stringify(oldValues) : null}, 
              ${newValues ? JSON.stringify(newValues) : null})
    `
  } catch (error) {
    console.error('Error logging action:', error)
  }
}
