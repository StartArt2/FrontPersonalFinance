"use client"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import LoginForm from "@/components/auth/LoginForm"
import Dashboard from "@/components/dashboard/Dashboard"
import LoadingSpinner from "@/components/ui/LoadingSpinner"

function AppContent() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoginForm />
  }

  return <Dashboard />
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
