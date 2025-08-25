"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import ThemeToggle from "@/components/ui/ThemeToggle"

export default function Header({ user, onMenuClick }) {
  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>

        <div className="hidden md:block">
          <h2 className="text-lg font-semibold text-foreground">Bienvenido, {user?.username}</h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
      </div>
    </header>
  )
}
