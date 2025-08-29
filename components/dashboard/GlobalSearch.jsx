"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/services/apiService"
import {
  Search,
  Filter,
  X,
  Eye,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Receipt,
  Wallet,
  TrendingUp,
  Database,
} from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import RecordDetails from "@/components/data/RecordDetails"

export default function GlobalSearch() {
  const [allRecords, setAllRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTypes, setSelectedTypes] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const recordTypes = [
    { key: "caja", label: "Caja", icon: Wallet, color: "bg-emerald-500" },
    { key: "compra", label: "Compras", icon: ShoppingCart, color: "bg-blue-500" },
    { key: "gastoFijo", label: "Gastos Fijos", icon: Receipt, color: "bg-red-500" },
    { key: "gastoVariable", label: "Gastos Variables", icon: TrendingUp, color: "bg-orange-500" },
    { key: "deuda", label: "Deudas", icon: CreditCard, color: "bg-purple-500" },
    { key: "abono", label: "Abonos", icon: DollarSign, color: "bg-green-500" },
  ]

  const performSearch = async () => {
    if (!searchTerm.trim() && selectedTypes.length === 0) return

    setLoading(true)
    setHasSearched(true)

    try {
      const [cajas, compras, gastosFijos, gastosVariables, deudas, abonos] = await Promise.all([
        apiService.cajas.getAll(),
        apiService.compras.getAll(),
        apiService.gastosFijos.getAll(),
        apiService.gastosVariables.getAll(),
        apiService.deudas.getAll(),
        apiService.abonos.getAll(),
      ])

      const allData = [
        ...cajas.map((item) => ({ ...item, type: "caja" })),
        ...compras.map((item) => ({ ...item, type: "compra" })),
        ...gastosFijos.map((item) => ({ ...item, type: "gastoFijo" })),
        ...gastosVariables.map((item) => ({ ...item, type: "gastoVariable" })),
        ...deudas.map((item) => ({ ...item, type: "deuda" })),
        ...abonos.map((item) => ({ ...item, type: "abono" })),
      ]

      setAllRecords(allData)
      applyFilters(allData)
    } catch (error) {
      console.error("Error al buscar registros:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (records = allRecords) => {
    let filtered = [...records]

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter((record) => {
        const searchFields = [
          record.detalle,
          record.destino,
          record.descripcion,
          record.observaciones,
          record.valor?.toString(),
          record.monto_total?.toString(),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return searchFields.includes(searchTerm.toLowerCase())
      })
    }

    // Filtrar por tipos seleccionados
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((record) => selectedTypes.includes(record.type))
    }

    // Ordenar por fecha más reciente
    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha || a.fecha_inicio || 0)
      const dateB = new Date(b.fecha || b.fecha_inicio || 0)
      return dateB - dateA
    })

    setFilteredRecords(filtered)
  }

  useEffect(() => {
    if (hasSearched) {
      applyFilters()
    }
  }, [searchTerm, selectedTypes, allRecords])

  const getTypeConfig = (type) => {
    return (
      recordTypes.find((t) => t.key === type) || {
        label: type,
        icon: Database,
        color: "bg-gray-500",
      }
    )
  }

  const handleViewDetails = (record) => {
    setSelectedRecord(record)
    setShowDetails(true)
  }

  const toggleTypeFilter = (type) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSelectedTypes([])
    setAllRecords([])
    setFilteredRecords([])
    setHasSearched(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      performSearch()
    }
  }

  return (
    <Card className="gradient-card border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Búsqueda Global</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Barra de búsqueda principal */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar en todos los registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 bg-background/50"
            />
          </div>
          <Button onClick={performSearch} disabled={loading} className="flex items-center gap-2">
            {loading ? <LoadingSpinner size="sm" /> : <Search className="w-4 h-4" />}
            Buscar
          </Button>
        </div>

        {/* Controles de filtros */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
            {selectedTypes.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedTypes.length}
              </Badge>
            )}
          </Button>

          {hasSearched && (
            <Button variant="ghost" onClick={clearSearch} className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {recordTypes.map((type) => {
                const Icon = type.icon
                const isSelected = selectedTypes.includes(type.key)
                return (
                  <Button
                    key={type.key}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTypeFilter(type.key)}
                    className={`flex items-center gap-2 text-xs ${isSelected ? type.color + " text-white" : ""}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{type.label}</span>
                    <span className="sm:hidden">{type.label.split(" ")[0]}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Resultados de búsqueda */}
        {hasSearched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Resultados de búsqueda</h3>
              <Badge variant="secondary">{filteredRecords.length} registros encontrados</Badge>
            </div>

            {filteredRecords.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredRecords.map((record, index) => {
                  const typeConfig = getTypeConfig(record.type)
                  const Icon = typeConfig.icon
                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-background/70 rounded-lg p-3 sm:p-4 border border-border/50 hover:shadow-md transition-all duration-200 space-y-3 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div
                          className={`w-8 sm:w-10 h-8 sm:h-10 ${typeConfig.color} rounded-full flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base break-words">
                            {record.detalle || record.destino || record.descripcion || "Sin descripción"}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                            <Badge variant="outline" className="text-xs w-fit">
                              {typeConfig.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(record.fecha || record.fecha_inicio).toLocaleDateString("es-ES")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3">
                        <div className="text-right">
                          <div className="text-lg sm:text-xl font-bold text-primary break-all">
                            ${(record.valor || record.monto_total || record.ingresos_dia || 0).toLocaleString("es-ES")}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(record)}
                          className="hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No se encontraron registros que coincidan con tu búsqueda</p>
              </div>
            )}
          </div>
        )}

      </CardContent>

      {/* Modal de detalles */}
      {showDetails && selectedRecord && (
        <RecordDetails record={selectedRecord} isOpen={showDetails} onClose={() => setShowDetails(false)} />
      )}
    </Card>
  )
}
