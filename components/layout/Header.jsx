"use client"

import { Button } from "@/components/ui/button"
import { Menu, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function Header({ user, onMenuClick }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!mounted) {
    return null
  }

  return (
    <header className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="font-semibold text-foreground">Bienvenido, {user?.username}</h2>
          <p className="text-sm text-muted-foreground">Gestiona tus finanzas de manera inteligente</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="relative overflow-hidden transition-all duration-500 hover:scale-110 hover:bg-primary/10"
        >
          <div
            className={`transition-all duration-700 transform ${theme === "dark" ? "rotate-180 scale-110" : "rotate-0 scale-100"}`}
          >
            {theme === "dark" ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Sun className="w-4 h-4 text-yellow-500" />
            )}
          </div>
        </Button>
      </div>
    </header>
  )
}
