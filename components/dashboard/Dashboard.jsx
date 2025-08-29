"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import DashboardHome from "@/components/dashboard/DashboardHome"
import DataExplorer from "@/components/data/DataExplorer" // Agregado import del DataExplorer
import CajaManager from "@/components/managers/CajaManager"
import GastosFijosManager from "@/components/managers/GastosFijosManager"
import GastosVariablesManager from "@/components/managers/GastosVariablesManager"
import ComprasManager from "@/components/managers/ComprasManager"
import DeudasManager from "@/components/managers/DeudasManager"
import AbonosManager from "@/components/managers/AbonosManager"

const PAGES = {
  dashboard: "dashboard",
  datos: "datos", // Agregada página de datos
  caja: "caja",
  gastosFijos: "gastosFijos",
  gastosVariables: "gastosVariables",
  compras: "compras",
  deudas: "deudas",
  abonos: "abonos",
}

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(PAGES.dashboard)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  const renderCurrentPage = () => {
    switch (currentPage) {
      case PAGES.dashboard:
        return <DashboardHome />
      case PAGES.datos: // Agregado caso para datos
        return <DataExplorer />
      case PAGES.caja:
        return <CajaManager />
      case PAGES.gastosFijos:
        return <GastosFijosManager />
      case PAGES.gastosVariables:
        return <GastosVariablesManager />
      case PAGES.compras:
        return <ComprasManager />
      case PAGES.deudas:
        return <DeudasManager />
      case PAGES.abonos:
        return <AbonosManager />
      default:
        return <DashboardHome />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="animate-fade-in-scale">{renderCurrentPage()}</div>
        </main>
      </div>
    </div>
  )
}
