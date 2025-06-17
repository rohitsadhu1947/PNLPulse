import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import crypto from "crypto"

// Simple JWT verification for middleware
class SimpleJWTVerifier {
  private secret: string

  constructor(secret: string) {
    this.secret = secret
  }

  verify(token: string): any {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split(".")

      if (!encodedHeader || !encodedPayload || !signature) {
        throw new Error("Invalid token format")
      }

      // Verify signature
      const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`)
      if (signature !== expectedSignature) {
        throw new Error("Invalid signature")
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload))

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("Token expired")
      }

      return payload
    } catch (error) {
      throw new Error("Invalid token")
    }
  }

  private base64UrlDecode(str: string): string {
    str += "=".repeat((4 - (str.length % 4)) % 4)
    return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
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

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-minimum-32-characters-long-not-for-production"
const jwtVerifier = new SimpleJWTVerifier(JWT_SECRET)

const publicPaths = ["/auth", "/api/auth"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth_token")?.value

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    if (token && pathname.startsWith("/auth")) {
      try {
        jwtVerifier.verify(token)
        return NextResponse.redirect(new URL("/dashboard", request.url))
      } catch {
        // Invalid token, continue to auth
      }
    }
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (!token) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  try {
    const payload = jwtVerifier.verify(token)

    if (pathname.startsWith("/api/")) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("x-user-id", payload.userId.toString())

      return NextResponse.next({
        request: { headers: requestHeaders },
      })
    }

    return NextResponse.next()
  } catch (error) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const response = NextResponse.redirect(new URL("/auth", request.url))
    response.cookies.delete("auth_token")
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
