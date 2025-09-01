"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Home,
  Wallet,
  TrendingDown,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  DollarSign,
  LogOut,
  X,
  Sparkles,
  Database,
  BarChart3,
} from "lucide-react"

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "estadisticas", label: "Estadísticas", icon: BarChart3 }, // Added statistics menu item
  { id: "datos", label: "Datos", icon: Database }, // Agregado nuevo botón Datos
  { id: "caja", label: "Caja", icon: Wallet },
  { id: "gastosFijos", label: "Gastos Fijos", icon: TrendingDown },
  { id: "gastosVariables", label: "Gastos Variables", icon: TrendingUp },
  { id: "compras", label: "Compras", icon: ShoppingCart },
  { id: "deudas", label: "Deudas", icon: CreditCard },
  { id: "abonos", label: "Abonos", icon: DollarSign },
]

export default function Sidebar({ currentPage, setCurrentPage, isOpen, setIsOpen }) {
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-sidebar-foreground">FinanceFlow</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="lg:hidden">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
                <span className="text-sidebar-accent-foreground font-medium">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-sidebar-foreground">{user?.username}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`
                    w-full justify-start space-x-3 transition-all duration-300
                    ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg transform scale-105"
                        : "text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                    }
                  `}
                  onClick={() => {
                    setCurrentPage(item.id)
                    setIsOpen(false)
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start space-x-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
