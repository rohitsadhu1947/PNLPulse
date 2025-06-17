"use client"

import type React from "react"

import { useAuth } from "./AuthProvider"
import { useEffect, useState } from "react"

interface ProtectedRouteProps {
  permission?: string
  role?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function ProtectedRoute({
  permission,
  role,
  fallback = <div className="p-4 text-center text-red-600">Access denied</div>,
  children,
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, hasRole } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return fallback
  }

  if (permission && !hasPermission(permission)) {
    return fallback
  }

  if (role && !hasRole(role)) {
    return fallback
  }

  return <>{children}</>
}
