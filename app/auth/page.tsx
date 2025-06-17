import { LoginForm } from "@/components/auth/LoginForm"

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Sales Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">Enterprise Sales Management Platform</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium">Default Login Credentials:</p>
            <p className="text-xs text-blue-600">Email: admin@company.com</p>
            <p className="text-xs text-blue-600">Password: password123</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
