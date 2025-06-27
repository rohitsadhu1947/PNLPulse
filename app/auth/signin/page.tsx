"use client"
import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInPageInner />
    </Suspense>
  )
}

function SignInPageInner() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const params = useSearchParams()
  const errorParam = params.get("error")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else if (res?.ok) {
      window.location.href = "/"
    }
  }

  // Google credentials check (env vars are not available client-side, so just show as 'Coming soon')
  const googleAvailable = false

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-blue-100">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-2">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-extrabold text-blue-700 tracking-tight">PNLPulse</h1>
        </div>
        {/* Welcome Message */}
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Welcome to PNLPulse</h2>
          <p className="text-gray-500 text-sm">Your AI-powered sales and performance platform</p>
        </div>
        {(error || errorParam) && (
          <div className="mb-4 text-red-600 text-sm text-center">
            {error || errorParam}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="my-6 flex items-center justify-center">
          <span className="text-gray-400 text-xs">OR</span>
        </div>
      </div>
    </div>
  )
} 