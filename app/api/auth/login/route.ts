import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { cookies } from "next/headers"

// Simple JWT implementation using Node.js crypto
class SimpleJWT {
  private secret: string

  constructor(secret: string) {
    this.secret = secret
  }

  sign(payload: any): string {
    const header = { alg: "HS256", typ: "JWT" }
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 7 * 24 * 60 * 60 // 7 days

    const jwtPayload = { ...payload, iat: now, exp: exp }
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(jwtPayload))
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  }

  private createSignature(data: string): string {
    return crypto
      .createHmac("sha256", this.secret)
      .update(data)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "")
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-minimum-32-characters-long"
const jwt = new SimpleJWT(JWT_SECRET)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    // Find user in database
    const [user] = await sql`
      SELECT id, name, email, password, is_active
      FROM users
      WHERE email = ${email} AND is_active = true
    `

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Get user roles and permissions
    const [userWithRoles] = await sql`
      SELECT 
        u.id, u.name, u.email,
        COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) as roles,
        COALESCE(array_agg(DISTINCT p.permission) FILTER (WHERE p.permission IS NOT NULL), ARRAY[]::text[]) as permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN LATERAL jsonb_array_elements_text(r.permissions) p(permission) ON true
      WHERE u.id = ${user.id}
      GROUP BY u.id, u.name, u.email
    `

    const userData = userWithRoles || user

    // Create JWT token
    const token = jwt.sign({ userId: user.id })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    // Update last login
    await sql`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ${user.id}`

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        roles: userData.roles || [],
        permissions: userData.permissions || [],
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
