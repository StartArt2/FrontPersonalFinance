"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiService } from "@/services/apiService"
import {
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Wallet,
  Filter,
  Search,
  BarChart3,
  X,
} from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RecordDetails from "@/components/data/RecordDetails"
import MoneyInput from "@/components/ui/MoneyInput"

export default function CajaManager() {
  const [caja, setCaja] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    valor: "",
    detalle: "Ingreso",
    origen: "",
  })
  const [filters, setFilters] = useState({
    searchText: "",
    fechaInicio: "",
    fechaFin: "",
    montoMin: "",
    montoMax: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [totalAcumulado, setTotalAcumulado] = useState(0)
  const [filteredIngresos, setFilteredIngresos] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [analytics, setAnalytics] = useState({
    ingresosPorDia: {},
    ingresosPorMes: {},
    ingresosPorOrigen: {},
    promediosDiarios: 0,
    mayorIngreso: null,
    menorIngreso: null,
    tendencia: "neutral",
  })

  useEffect(() => {
    loadCaja()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [caja, filters])

  const loadCaja = async () => {
    try {
      const data = await apiService.caja.get()
      setCaja(data)
      setTotalAcumulado(data.total_acumulado || 0)
      calculateAnalytics(data.ingresos || [])
    } catch (error) {
      setError("Error al cargar la caja")
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (ingresos) => {
    if (!ingresos || ingresos.length === 0) {
      setAnalytics({
        ingresosPorDia: {},
        ingresosPorMes: {},
        ingresosPorOrigen: {},
        promediosDiarios: 0,
        mayorIngreso: null,
        menorIngreso: null,
        tendencia: "neutral",
      })
      return
    }

    // Agrupar por día
    const ingresosPorDia = {}
    const ingresosPorMes = {}
    const ingresosPorOrigen = {}

    ingresos.forEach((ingreso) => {
      const fecha = new Date(ingreso.fecha)
      const dia = fecha.toISOString().split("T")[0]
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`
      const origen = ingreso.origen || "Sin origen"

      // Por día
      if (!ingresosPorDia[dia]) {
        ingresosPorDia[dia] = { total: 0, cantidad: 0, ingresos: [] }
      }
      ingresosPorDia[dia].total += ingreso.valor
      ingresosPorDia[dia].cantidad += 1
      ingresosPorDia[dia].ingresos.push(ingreso)

      // Por mes
      if (!ingresosPorMes[mes]) {
        ingresosPorMes[mes] = { total: 0, cantidad: 0 }
      }
      ingresosPorMes[mes].total += ingreso.valor
      ingresosPorMes[mes].cantidad += 1

      // Por origen
      if (!ingresosPorOrigen[origen]) {
        ingresosPorOrigen[origen] = { total: 0, cantidad: 0 }
      }
      ingresosPorOrigen[origen].total += ingreso.valor
      ingresosPorOrigen[origen].cantidad += 1
    })

    // Calcular promedios y extremos
    const valores = ingresos.map((i) => i.valor)
    const mayorIngreso = ingresos.find((i) => i.valor === Math.max(...valores))
    const menorIngreso = ingresos.find((i) => i.valor === Math.min(...valores))
    const promediosDiarios =
      Object.keys(ingresosPorDia).length > 0
        ? Object.values(ingresosPorDia).reduce((sum, dia) => sum + dia.total, 0) / Object.keys(ingresosPorDia).length
        : 0

    // Calcular tendencia (últimos 7 días vs anteriores 7 días)
    const hoy = new Date()
    const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
    const hace14Dias = new Date(hoy.getTime() - 14 * 24 * 60 * 60 * 1000)

    const ingresosUltimos7 = ingresos.filter((i) => new Date(i.fecha) >= hace7Dias).reduce((sum, i) => sum + i.valor, 0)
    const ingresosAnteriores7 = ingresos
      .filter((i) => new Date(i.fecha) >= hace14Dias && new Date(i.fecha) < hace7Dias)
      .reduce((sum, i) => sum + i.valor, 0)

    let tendencia = "neutral"
    if (ingresosUltimos7 > ingresosAnteriores7 * 1.1) tendencia = "up"
    else if (ingresosUltimos7 < ingresosAnteriores7 * 0.9) tendencia = "down"

    setAnalytics({
      ingresosPorDia,
      ingresosPorMes,
      ingresosPorOrigen,
      promediosDiarios,
      mayorIngreso,
      menorIngreso,
      tendencia,
    })
  }

  const applyFilters = () => {
    let filtered = [...(caja?.ingresos || [])]

    if (filters.searchText) {
      filtered = filtered.filter(
        (ingreso) =>
          ingreso.detalle?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
          ingreso.origen?.toLowerCase().includes(filters.searchText.toLowerCase()),
      )
    }

    if (filters.fechaInicio) {
      filtered = filtered.filter((ingreso) => new Date(ingreso.fecha) >= new Date(filters.fechaInicio))
    }

    if (filters.fechaFin) {
      filtered = filtered.filter((ingreso) => new Date(ingreso.fecha) <= new Date(filters.fechaFin))
    }

    if (filters.montoMin) {
      filtered = filtered.filter((ingreso) => ingreso.valor >= Number(filters.montoMin))
    }

    if (filters.montoMax) {
      filtered = filtered.filter((ingreso) => ingreso.valor <= Number(filters.montoMax))
    }

    filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    setFilteredIngresos(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const fechaLocal = new Date(formData.fecha + "T00:00:00") // mantiene el día local
      const result = await apiService.caja.addIngreso({
        fecha: fechaLocal, // ahora es un Date con hora local
        valor: Number(formData.valor),
        detalle: formData.detalle || "Ingreso",
        origen: formData.origen || "",
      })

      setCaja(result.caja)
      setTotalAcumulado(result.caja.total_acumulado || 0)
      calculateAnalytics(result.caja.ingresos || [])

      setSuccess("Ingreso registrado exitosamente")
      setFormData({
        fecha: new Date().toISOString().slice(0, 10),
        valor: "",
        detalle: "Ingreso",
        origen: "",
      })
      setShowForm(false)
    } catch (err) {
      setError(err.message || "Error al guardar ingreso")
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleMoneyChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      valor: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      searchText: "",
      fechaInicio: "",
      fechaFin: "",
      montoMin: "",
      montoMax: "",
    })
  }

  const handleViewDetails = (ingreso) => {
    setSelectedRecord({ ...ingreso, type: "ingreso" })
    setShowDetails(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const getTopOrigins = () => {
    return Object.entries(analytics.ingresosPorOrigen)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header con Total Acumulado - Responsive */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Gestión de Caja</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Administra los ingresos y controla tu dinero total
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gradient-primary hover:opacity-90 transition-all duration-300 w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Ingreso
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto gradient-card border-0 shadow-2xl animate-scale-in">
              <CardHeader className="pb-4 border-b border-border/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-primary">💰 Nuevo Ingreso</CardTitle>
                    <CardDescription>Registra un nuevo ingreso que se sumará a tu total disponible</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fecha" className="text-sm font-medium">
                        📅 Fecha
                      </Label>
                      <Input
                        id="fecha"
                        name="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={handleChange}
                        className="bg-input/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor" className="text-sm font-medium">
                        💵 Monto del Ingreso
                      </Label>
                      <MoneyInput
                        value={formData.valor}
                        onChange={handleMoneyChange}
                        placeholder="0"
                        className="bg-input/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="detalle" className="text-sm font-medium">
                        📝 Descripción
                      </Label>
                      <Input
                        id="detalle"
                        name="detalle"
                        value={formData.detalle}
                        onChange={handleChange}
                        placeholder="Ingreso"
                        className="bg-input/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="origen" className="text-sm font-medium">
                        🏢 Fuente/Origen
                      </Label>
                      <Input
                        id="origen"
                        name="origen"
                        value={formData.origen}
                        onChange={handleChange}
                        placeholder="Ej: Ventas, Servicios, Transferencia..."
                        className="bg-input/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-border/20">
                    <Button
                      type="submit"
                      className="gradient-primary w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Guardar Ingreso
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="w-full sm:w-auto hover:bg-muted/50"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="gradient-card border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center shadow-lg">
                <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-medium text-muted-foreground mb-2">💰 Total Disponible</h2>
                <div className="text-3xl sm:text-5xl font-bold text-primary break-all mb-3">
                  {formatCurrency(totalAcumulado)}
                </div>
                <div className="flex items-center justify-center gap-3">
                  {analytics.tendencia === "up" && (
                    <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Tendencia positiva</span>
                    </div>
                  )}
                  {analytics.tendencia === "down" && (
                    <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      <TrendingDown className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Tendencia negativa</span>
                    </div>
                  )}
                  {analytics.tendencia === "neutral" && (
                    <div className="flex items-center text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium">Tendencia estable</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">📊 Total Ingresos</p>
                  <p className="text-2xl font-bold text-primary">{caja?.ingresos?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">📈 Promedio Diario</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(analytics.promediosDiarios)}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">🏆 Mayor Ingreso</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.mayorIngreso ? formatCurrency(analytics.mayorIngreso.valor) : "$0"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">📅 Días Activos</p>
                  <p className="text-2xl font-bold text-primary">{Object.keys(analytics.ingresosPorDia).length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showFilters && (
          <Card className="gradient-card border-0 shadow-lg animate-fade-in-scale">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="searchText">Buscar por texto</Label>
                  <Input
                    id="searchText"
                    name="searchText"
                    value={filters.searchText}
                    onChange={handleFilterChange}
                    placeholder="Detalle u origen..."
                    className="bg-input/50 border-border/50 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha desde</Label>
                  <Input
                    id="fechaInicio"
                    name="fechaInicio"
                    type="date"
                    value={filters.fechaInicio}
                    onChange={handleFilterChange}
                    className="bg-input/50 border-border/50 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha hasta</Label>
                  <Input
                    id="fechaFin"
                    name="fechaFin"
                    type="date"
                    value={filters.fechaFin}
                    onChange={handleFilterChange}
                    className="bg-input/50 border-border/50 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montoMin">Monto mínimo</Label>
                  <Input
                    id="montoMin"
                    name="montoMin"
                    type="number"
                    value={filters.montoMin}
                    onChange={handleFilterChange}
                    placeholder="0"
                    className="bg-input/50 border-border/50 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montoMax">Monto máximo</Label>
                  <Input
                    id="montoMax"
                    name="montoMax"
                    type="number"
                    value={filters.montoMax}
                    onChange={handleFilterChange}
                    placeholder="999999999"
                    className="bg-input/50 border-border/50 focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button onClick={clearFilters} variant="outline" className="w-full sm:w-auto bg-transparent">
                  Limpiar Filtros
                </Button>
                <div className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start">
                  Mostrando {filteredIngresos.length} de {caja?.ingresos?.length || 0} registros
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {error && (
          <Alert className="border-destructive/50 bg-destructive/10 animate-slide-in-up">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-primary/50 bg-primary/10 animate-slide-in-up">
            <AlertDescription className="text-primary">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {filteredIngresos.length > 0 ? (
            filteredIngresos.map((ingreso) => (
              <Card
                key={ingreso._id}
                className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:border-primary/20"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg text-primary">
                            {ingreso.detalle && ingreso.detalle !== "" ? ingreso.detalle : "Ingreso"}
                          </h4>
                          {ingreso.origen && (
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                              📍 {ingreso.origen}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mb-2">{formatCurrency(ingreso.valor)}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(ingreso.fecha).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(ingreso)}
                        className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-300"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="gradient-card border-0 shadow-lg">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {caja?.ingresos?.length === 0
                    ? "🎯 ¡Comienza tu gestión financiera!"
                    : "🔍 No se encontraron ingresos"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {caja?.ingresos?.length === 0
                    ? "Registra tu primer ingreso y comienza a controlar tus finanzas de manera profesional"
                    : "Intenta ajustar los filtros de búsqueda para encontrar los registros que necesitas"}
                </p>
                {caja?.ingresos?.length === 0 ? (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="gradient-primary shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Primer Ingreso
                  </Button>
                ) : (
                  <Button onClick={clearFilters} variant="outline" className="hover:bg-muted/50 bg-transparent">
                    Limpiar Filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de detalles */}
        {showDetails && selectedRecord && (
          <RecordDetails record={selectedRecord} isOpen={showDetails} onClose={() => setShowDetails(false)} />
        )}
      </div>
    </div>
  )
}
