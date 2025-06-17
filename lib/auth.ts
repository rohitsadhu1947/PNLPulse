import { cookies } from "next/headers"
import { verify, sign } from "jsonwebtoken"
import { sql } from "./db"
import bcrypt from "bcryptjs"

export interface User {
  id: number
  name: string
  email: string
  roles: string[]
  permissions: string[]
  isActive: boolean
}

// Use a strong default secret for development, but require proper secret in production
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("JWT_SECRET is required in production")
      })()
    : "dev-secret-key-minimum-32-characters-long-not-for-production")

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createAuthToken(userId: number): Promise<string> {
  return sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
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
      isActive: user.is_active,
    }
  } catch (error) {
    console.error("Error fetching user with roles:", error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    if (!token) return null

    const payload = verify(token, JWT_SECRET) as any
    const user = await getUserWithRoles(payload.userId)

    return user
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export function hasPermission(user: User, permission: string): boolean {
  if (user.permissions.includes("*")) return true
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
    console.error("Authentication error:", error)
    return null
  }
}

export async function logAction(
  userId: number,
  action: string,
  tableName: string,
  recordId?: number,
  oldValues?: any,
  newValues?: any,
) {
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
      VALUES (${userId}, ${action}, ${tableName}, ${recordId || null}, 
              ${oldValues ? JSON.stringify(oldValues) : null}, 
              ${newValues ? JSON.stringify(newValues) : null})
    `
  } catch (error) {
    console.error("Error logging action:", error)
  }
}
