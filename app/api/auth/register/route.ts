import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { cookies } from "next/headers"

// Simple JWT implementation (same as login)
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
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user already exists
    const [existingUser] = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const [newUser] = await sql`
      INSERT INTO users (name, email, password, is_active, created_at)
      VALUES (${name}, ${email}, ${hashedPassword}, true, CURRENT_TIMESTAMP)
      RETURNING id, name, email
    `

    // Assign default user role (role_id = 2)
    try {
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${newUser.id}, 2)
      `
    } catch (roleError) {
      console.warn("Could not assign default role:", roleError)
    }

    // Create JWT token
    const token = jwt.sign({ userId: newUser.id })

    // Set cookie
    cookies().set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roles: ["user"],
        permissions: [],
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
