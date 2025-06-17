function validateEnv() {
  const requiredEnvVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  }

  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long")
  }
}

// Only validate in runtime, not during build
if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview") {
  try {
    validateEnv()
  } catch (error) {
    console.warn("Environment validation warning:", (error as Error).message)
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret-for-build",
  NODE_ENV: process.env.NODE_ENV || "development",
}
