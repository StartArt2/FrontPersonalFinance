"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/services/apiService"
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Database,
  Eye,
  Search,
  Filter,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Receipt,
  Wallet,
  TrendingUp,
  X,
} from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RecordDetails from "./RecordDetails"

export default function DataExplorer() {
  const [allData, setAllData] = useState({})
  const [filteredData, setFilteredData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedYears, setExpandedYears] = useState({})
  const [expandedMonths, setExpandedMonths] = useState({})
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTypes, setSelectedTypes] = useState([])
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [showFilters, setShowFilters] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)

  const recordTypes = [
    { key: "ingreso", label: "Ingresos", icon: Wallet, color: "bg-emerald-500" },
    { key: "compra", label: "Compras", icon: ShoppingCart, color: "bg-blue-500" },
    { key: "gastoFijo", label: "Gastos Fijos", icon: Receipt, color: "bg-red-500" },
    { key: "gastoVariable", label: "Gastos Variables", icon: TrendingUp, color: "bg-orange-500" },
    { key: "deuda", label: "Deudas", icon: CreditCard, color: "bg-purple-500" },
    { key: "abono", label: "Abonos", icon: DollarSign, color: "bg-green-500" },
  ]

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [allData, searchTerm, selectedTypes, dateRange])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const loadAllData = async () => {
    try {
      const [caja, compras, gastosFijos, gastosVariables, deudas, abonos] = await Promise.all([
        apiService.caja.get(),
        apiService.compras.getAll(),
        apiService.gastosFijos.getAll(),
        apiService.gastosVariables.getAll(),
        apiService.deudas.getAll(),
        apiService.abonos.getAll(),
      ])

      const organizedData = {}
      let recordCount = 0
      let totalValue = 0

      const addToOrganized = (items, type) => {
        items.forEach((item) => {
          const date = new Date(item.fecha || item.fecha_inicio)
          const year = date.getFullYear()
          const month = date.getMonth() + 1
          const day = date.getDate()

          if (!organizedData[year]) organizedData[year] = {}
          if (!organizedData[year][month]) organizedData[year][month] = {}
          if (!organizedData[year][month][day]) organizedData[year][month][day] = []

          const record = { ...item, type }
          organizedData[year][month][day].push(record)

          recordCount++
          totalValue += Number(item.valor || item.monto_total || 0)
        })
      }

      addToOrganized(caja.ingresos || [], "ingreso")
      addToOrganized(compras, "compra")
      addToOrganized(gastosFijos, "gastoFijo")
      addToOrganized(gastosVariables, "gastoVariable")
      addToOrganized(deudas, "deuda")
      addToOrganized(abonos, "abono")

      setAllData(organizedData)
      setTotalRecords(recordCount)
      setTotalAmount(totalValue)
    } catch (error) {
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = { ...allData }

    if (selectedTypes.length > 0) {
      const newFiltered = {}
      Object.keys(filtered).forEach((year) => {
        Object.keys(filtered[year]).forEach((month) => {
          Object.keys(filtered[year][month]).forEach((day) => {
            const dayRecords = filtered[year][month][day].filter((record) => selectedTypes.includes(record.type))
            if (dayRecords.length > 0) {
              if (!newFiltered[year]) newFiltered[year] = {}
              if (!newFiltered[year][month]) newFiltered[year][month] = {}
              newFiltered[year][month][day] = dayRecords
            }
          })
        })
      })
      filtered = newFiltered
    }

    if (searchTerm) {
      const newFiltered = {}
      Object.keys(filtered).forEach((year) => {
        Object.keys(filtered[year]).forEach((month) => {
          Object.keys(filtered[year][month]).forEach((day) => {
            const dayRecords = filtered[year][month][day].filter((record) => {
              const searchFields = [
                record.detalle,
                record.destino,
                record.descripcion,
                record.observaciones,
                record.origen,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()

              return searchFields.includes(searchTerm.toLowerCase())
            })
            if (dayRecords.length > 0) {
              if (!newFiltered[year]) newFiltered[year] = {}
              if (!newFiltered[year][month]) newFiltered[year][month] = {}
              newFiltered[year][month][day] = dayRecords
            }
          })
        })
      })
      filtered = newFiltered
    }

    if (dateRange.start || dateRange.end) {
      const newFiltered = {}
      const startDate = dateRange.start ? new Date(dateRange.start) : null
      const endDate = dateRange.end ? new Date(dateRange.end) : null

      Object.keys(filtered).forEach((year) => {
        Object.keys(filtered[year]).forEach((month) => {
          Object.keys(filtered[year][month]).forEach((day) => {
            const currentDate = new Date(year, month - 1, day)

            const isInRange = (!startDate || currentDate >= startDate) && (!endDate || currentDate <= endDate)

            if (isInRange) {
              if (!newFiltered[year]) newFiltered[year] = {}
              if (!newFiltered[year][month]) newFiltered[year][month] = {}
              newFiltered[year][month][day] = filtered[year][month][day]
            }
          })
        })
      })
      filtered = newFiltered
    }

    setFilteredData(filtered)
  }

  const toggleYear = (year) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }))
  }

  const toggleMonth = (year, month) => {
    const key = `${year}-${month}`
    setExpandedMonths((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getMonthName = (month) => {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    return months[month - 1]
  }

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

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedTypes([])
    setDateRange({ start: "", end: "" })
  }

  const getFilteredStats = () => {
    let count = 0
    let total = 0

    Object.keys(filteredData).forEach((year) => {
      Object.keys(filteredData[year]).forEach((month) => {
        Object.keys(filteredData[year][month]).forEach((day) => {
          filteredData[year][month][day].forEach((record) => {
            count++
            total += Number(record.valor || record.monto_total || 0)
          })
        })
      })
    })

    return { count, total }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const filteredStats = getFilteredStats()

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Explorador de Datos
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Navega y filtra todos tus registros financieros
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-8 space-y-2 sm:space-y-0">
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">Total registros</div>
              <div className="text-xl sm:text-2xl font-bold text-primary">{filteredStats.count}</div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">Valor total</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 break-all">
                {formatCurrency(filteredStats.total)}
              </div>
            </div>
          </div>
        </div>

        <Card className="gradient-card border-0 shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 sm:w-4 h-3 sm:h-4" />
                <Input
                  placeholder="Buscar por detalle, destino, descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 bg-background/50 text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 text-sm"
                >
                  <Filter className="w-3 sm:w-4 h-3 sm:h-4" />
                  Filtros
                  {selectedTypes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {selectedTypes.length}
                    </Badge>
                  )}
                </Button>

                {(searchTerm || selectedTypes.length > 0 || dateRange.start || dateRange.end) && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-2 text-sm"
                  >
                    <X className="w-3 sm:w-4 h-3 sm:h-4" />
                    Limpiar
                  </Button>
                )}
              </div>

              {showFilters && (
                <div className="pt-4 border-t border-border/50 space-y-4">
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

                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">Filtrar por rango de fechas:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Desde:</label>
                        <Input
                          type="date"
                          placeholder="Fecha inicio"
                          value={dateRange.start}
                          onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                          className="bg-background/50 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Hasta:</label>
                        <Input
                          type="date"
                          placeholder="Fecha fin"
                          value={dateRange.end}
                          onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                          className="bg-background/50 text-sm"
                        />
                      </div>
                    </div>
                    {(dateRange.start || dateRange.end) && (
                      <div className="text-xs text-primary bg-primary/10 rounded-md p-2">
                        📅 Mostrando registros{" "}
                        {dateRange.start && `desde ${new Date(dateRange.start).toLocaleDateString("es-ES")}`}
                        {dateRange.start && dateRange.end && " "}
                        {dateRange.end && `hasta ${new Date(dateRange.end).toLocaleDateString("es-ES")}`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {filteredStats.count === totalRecords
                    ? `Mostrando todos los ${totalRecords} registros`
                    : `Mostrando ${filteredStats.count} de ${totalRecords} registros`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10 animate-slide-in-up">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      <Card className="gradient-card border-0 shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
            <span>Registros por Fecha</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Explora tus registros organizados cronológicamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {Object.keys(filteredData)
            .sort((a, b) => b - a)
            .map((year) => (
              <div key={year} className="border border-border/50 rounded-lg p-3 sm:p-4 bg-background/30">
                <Button
                  variant="ghost"
                  onClick={() => toggleYear(year)}
                  className="w-full justify-between p-2 h-auto hover:bg-primary/5"
                >
                  <span className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
                    {year}
                  </span>
                  {expandedYears[year] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>

                {expandedYears[year] && (
                  <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 pl-2 sm:pl-4">
                    {Object.keys(filteredData[year])
                      .sort((a, b) => b - a)
                      .map((month) => (
                        <div key={month} className="border-l-2 border-primary/20 pl-3 sm:pl-4">
                          <Button
                            variant="ghost"
                            onClick={() => toggleMonth(year, month)}
                            className="w-full justify-between p-2 h-auto hover:bg-primary/5"
                          >
                            <span className="text-sm sm:text-base font-medium flex items-center gap-2">
                              📅 {getMonthName(Number.parseInt(month))}
                            </span>
                            {expandedMonths[`${year}-${month}`] ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>

                          {expandedMonths[`${year}-${month}`] && (
                            <div className="mt-2 space-y-2 pl-2 sm:pl-4">
                              {Object.keys(filteredData[year][month])
                                .sort((a, b) => b - a)
                                .map((day) => (
                                  <div
                                    key={day}
                                    className="bg-muted/30 rounded-lg p-3 sm:p-4 border border-border/30 hover:shadow-md transition-all duration-200 space-y-3"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                                      <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                                        🗓️ Día {day}
                                      </h4>
                                      <Badge variant="secondary" className="text-xs w-fit">
                                        {filteredData[year][month][day].length} registros
                                      </Badge>
                                    </div>
                                    <div className="grid gap-2 sm:gap-3">
                                      {filteredData[year][month][day].map((record, index) => {
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
                                                  {record.detalle ||
                                                    record.destino ||
                                                    record.descripcion ||
                                                    "Sin descripción"}
                                                </p>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                                  <Badge variant="outline" className="text-xs w-fit">
                                                    {typeConfig.label}
                                                  </Badge>
                                                  {record.type === "ingreso" && record.origen && (
                                                    <span className="text-xs text-muted-foreground break-words">
                                                      • {record.origen}
                                                    </span>
                                                  )}
                                                  {record.type !== "ingreso" && record.destino && record.detalle && (
                                                    <span className="text-xs text-muted-foreground break-words">
                                                      • {record.destino}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                                              <div className="text-right">
                                                <div className="text-sm sm:text-lg lg:text-xl font-bold text-primary break-all">
                                                  {formatCurrency(record.valor || record.monto_total || 0)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                  {new Date(record.fecha || record.fecha_inicio).toLocaleDateString(
                                                    "es-ES",
                                                  )}
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
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}

          {Object.keys(filteredData).length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <Database className="w-12 sm:w-16 h-12 sm:h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {Object.keys(allData).length === 0 ? "No hay datos disponibles" : "No se encontraron registros"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {Object.keys(allData).length === 0
                  ? "Comienza registrando transacciones en los diferentes módulos"
                  : "Intenta ajustar los filtros de búsqueda"}
              </p>
              {Object.keys(allData).length > 0 && (
                <Button onClick={clearFilters} variant="outline" className="text-sm bg-transparent">
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showDetails && selectedRecord && (
        <RecordDetails record={selectedRecord} isOpen={showDetails} onClose={() => setShowDetails(false)} />
      )}
    </div>
  )
}
