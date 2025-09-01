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
    { key: "ingreso", label: "Ingresos", icon: Wallet, color: "bg-emerald-500" },
    { key: "compra", label: "Compras", icon: ShoppingCart, color: "bg-blue-500" },
    { key: "gastoFijo", label: "Gastos Fijos", icon: Receipt, color: "bg-red-500" },
    { key: "gastoVariable", label: "Gastos Variables", icon: TrendingUp, color: "bg-orange-500" },
    { key: "deuda", label: "Deudas", icon: CreditCard, color: "bg-purple-500" },
    { key: "abono", label: "Abonos", icon: DollarSign, color: "bg-green-500" },
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const performSearch = async () => {
    if (!searchTerm.trim() && selectedTypes.length === 0) return

    setLoading(true)
    setHasSearched(true)

    try {
      const [cajaData, ingresos, compras, gastosFijos, gastosVariables, deudas, abonos] = await Promise.all([
        apiService.caja.get(),
        apiService.caja.listIngresos(),
        apiService.compras.getAll(),
        apiService.gastosFijos.getAll(),
        apiService.gastosVariables.getAll(),
        apiService.deudas.getAll(),
        apiService.abonos.getAll(),
      ])

      const ingresosRecords = (ingresos || []).map((item) => ({ ...item, type: "ingreso" }))

      const allData = [
        ...ingresosRecords,
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
      setAllRecords([])
      setFilteredRecords([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (records = allRecords) => {
    let filtered = [...records]

    if (searchTerm.trim()) {
      filtered = filtered.filter((record) => {
        const searchFields = [
          record.detalle,
          record.destino,
          record.descripcion,
          record.observaciones,
          record.origen,
          record.valor?.toString(),
          record.monto_total?.toString(),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return searchFields.includes(searchTerm.toLowerCase())
      })
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((record) => selectedTypes.includes(record.type))
    }

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
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <Search className="w-2 sm:w-5 h-4 sm:h-5" />
          <span>Búsqueda Global</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 sm:w-4 h-3 sm:h-4" />
            <Input
              placeholder="Buscar en todos los registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-8 sm:pl-10 bg-background/50 text-sm"
            />
          </div>
          <Button onClick={performSearch} disabled={loading} className="flex items-center gap-2 text-sm">
            {loading ? <LoadingSpinner size="sm" /> : <Search className="w-3 sm:w-4 h-3 sm:h-4" />}
            Buscar
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm"
          >
            <Filter className="w-3 sm:w-4 h-3 sm:h-4" />
            Filtros
            {selectedTypes.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedTypes.length}
              </Badge>
            )}
          </Button>

          {hasSearched && (
            <Button variant="ghost" onClick={clearSearch} className="flex items-center gap-2 text-sm">
              <X className="w-3 sm:w-4 h-3 sm:h-4" />
              Limpiar
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50">
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

        {hasSearched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm sm:text-base">Resultados de búsqueda</h3>
              <Badge variant="secondary" className="text-xs">
                {filteredRecords.length} registros encontrados
              </Badge>
            </div>

            {filteredRecords.length > 0 ? (
              <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                {filteredRecords.map((record, index) => {
                  const typeConfig = getTypeConfig(record.type)
                  const Icon = typeConfig.icon
                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-background/70 rounded-lg p-3 sm:p-4 border border-border/50 hover:shadow-md transition-all duration-200 space-y-3 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div
                          className={`w-6 sm:w-8 lg:w-10 h-6 sm:h-8 lg:h-10 ${typeConfig.color} rounded-full flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm lg:text-base break-words">
                            {record.detalle || record.destino || record.descripcion || "Sin descripción"}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                            <Badge variant="outline" className="text-xs w-fit">
                              {typeConfig.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(record.fecha || record.fecha_inicio).toLocaleDateString("es-ES")}
                            </span>
                            {record.type === "ingreso" && record.origen && (
                              <span className="text-xs text-muted-foreground break-words">• {record.origen}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                        <div className="text-right">
                          <div className="text-sm sm:text-lg lg:text-xl font-bold text-primary break-all">
                            {formatCurrency(record.valor || record.monto_total || 0)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(record)}
                          className="hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0 h-6 sm:h-8 w-6 sm:w-8 p-0"
                        >
                          <Eye className="w-3 sm:w-4 h-3 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Search className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No se encontraron registros que coincidan con tu búsqueda</p>
              </div>
            )}
          </div>
        )}

        {hasSearched }
      </CardContent>

      {showDetails && selectedRecord && (
        <RecordDetails record={selectedRecord} isOpen={showDetails} onClose={() => setShowDetails(false)} />
      )}
    </Card>
  )
}
