"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiService } from "@/services/apiService"
import { DollarSign, TrendingUp, ShoppingCart, CreditCard, Calendar, PieChart, BarChart3, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RecordDetails from "@/components/data/RecordDetails"
import GlobalSearch from "./GlobalSearch"

export default function DashboardHome() {
  const [dashboardData, setDashboardData] = useState({
    saldoActual: 0,
    totalIngresos: 0,
    totalGastos: 0,
    totalCompras: 0,
    totalDeudas: 0,
    comprasDelMes: 0,
    deudasPendientes: 0,
    recentTransactions: [],
    gastosPorCategoria: [],
    ultimasTransacciones: [],
    proximosVencimientos: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const cajaData = await apiService.caja.get()
      const ingresos = await apiService.caja.listIngresos()
      const [compras, gastosFijos, gastosVariables, deudas, abonos] = await Promise.all([
        apiService.compras.getAll(),
        apiService.gastosFijos.getAll(),
        apiService.gastosVariables.getAll(),
        apiService.deudas.getAll(),
        apiService.abonos.getAll(),
      ])

      const totalIngresos = (ingresos || []).reduce((sum, item) => sum + (item.valor || 0), 0)
      const totalGastosFijos = gastosFijos.reduce((sum, gasto) => sum + (gasto.valor || 0), 0)
      const totalGastosVariables = gastosVariables.reduce((sum, gasto) => sum + (gasto.valor || 0), 0)
      const totalCompras = compras.reduce((sum, compra) => sum + (compra.valor || 0), 0)
      const totalGastos = totalGastosFijos + totalGastosVariables + totalCompras
      const totalDeudas = deudas.reduce((sum, deuda) => sum + (deuda.saldo_actual || 0), 0)
      const totalAbonos = abonos.reduce((sum, abono) => sum + (abono.valor || 0), 0)

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const comprasDelMes = compras
        .filter((compra) => {
          const compraDate = new Date(compra.fecha)
          return compraDate.getMonth() === currentMonth && compraDate.getFullYear() === currentYear
        })
        .reduce((sum, compra) => sum + (compra.valor || 0), 0)

      const deudasPendientes = deudas.filter((deuda) => deuda.saldo_actual > 0).length

      const gastosPorCategoria = [
        { categoria: "Gastos Fijos", valor: totalGastosFijos, color: "hsl(var(--destructive))" },
        { categoria: "Gastos Variables", valor: totalGastosVariables, color: "hsl(var(--secondary))" },
        { categoria: "Compras", valor: totalCompras, color: "hsl(var(--accent))" },
      ].filter((item) => item.valor > 0)

      const ingresosRecientes = (ingresos || []).map((item) => ({
        ...item,
        type: "ingreso",
        fecha: item.fecha,
      }))

      // Últimas transacciones (combinando todos los tipos)
      const todasTransacciones = [
        ...ingresosRecientes,
        ...compras.map((item) => ({ ...item, type: "compra", fecha: item.fecha })),
        ...gastosFijos.map((item) => ({ ...item, type: "gastoFijo", fecha: item.fecha })),
        ...gastosVariables.map((item) => ({ ...item, type: "gastoVariable", fecha: item.fecha })),
        ...abonos.map((item) => ({ ...item, type: "abono", fecha: item.fecha })),
      ]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5)

      // Próximos vencimientos (deudas con mayor saldo)
      const proximosVencimientos = deudas
        .filter((deuda) => deuda.saldo_actual > 0)
        .sort((a, b) => b.saldo_actual - a.saldo_actual)
        .slice(0, 5)
        .map((deuda) => ({ ...deuda, type: "deuda" }))

      setDashboardData({
        saldoActual: totalIngresos - totalGastos,
        totalIngresos, // <- now comes from the ingresos array
        totalGastos,
        totalCompras,
        totalDeudas,
        comprasDelMes,
        deudasPendientes,
        gastosPorCategoria,
        ultimasTransacciones: todasTransacciones,
        proximosVencimientos,
      })
    } catch (error) {
      console.error("[v0] Dashboard error:", error)
      setError("Error al cargar los datos del dashboard: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const getTypeIcon = (type) => {
    const icons = {
      ingreso: "💰",
      compra: "🛒",
      gastoFijo: "📋",
      gastoVariable: "💸",
      deuda: "💳",
      abono: "💵",
    }
    return icons[type] || "📄"
  }

  const getTypeColor = (type) => {
    const colors = {
      ingreso: "text-primary",
      compra: "text-accent",
      gastoFijo: "text-destructive",
      gastoVariable: "text-secondary",
      deuda: "text-destructive",
      abono: "text-primary",
    }
    return colors[type] || "text-foreground"
  }

  const handleViewDetails = (record) => {
    setSelectedRecord(record)
    setShowDetails(true)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">

      {/* Error Alert */}
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10 animate-slide-in-up">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      {/* Botón para desplegar GlobalSearch */}
      <div className="flex justify-end mb-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowGlobalSearch(!showGlobalSearch)}
          className="flex items-center gap-2"
        >
          {showGlobalSearch ? "Cerrar Búsqueda" : "Abrir Búsqueda Global"}
        </Button>
      </div>

      {/* Contenedor colapsable */}
      {showGlobalSearch && (
        <div className="mb-4 transition-all duration-500">
          <GlobalSearch />
        </div>
      )}

      <Card className="gradient-card border-0 shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 group-hover:from-primary/15 group-hover:to-accent/15 transition-all duration-700" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary" />
        <CardContent className="p-4 sm:p-6 lg:p-8 relative">
          <div className="text-center">
            <div>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-2 sm:mb-3 font-medium">
                Saldo Actual
              </p>
              <p
                className={`text-3xl sm:text-4xl lg:text-6xl font-bold animate-fade-in transition-all duration-500 break-all ${dashboardData.saldoActual >= 0 ? "text-primary" : "text-destructive"
                  }`}
              >
                {formatCurrency(dashboardData.saldoActual)}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-8 lg:space-x-12 pt-4 sm:pt-6">
              <div className="text-center group-hover:scale-105 transition-transform duration-300">
                <div className="w-3 h-3 bg-primary rounded-full mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-muted-foreground">Ingresos</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary break-all">
                  {formatCurrency(dashboardData.totalIngresos)}
                </p>
              </div>
              <div className="text-center group-hover:scale-105 transition-transform duration-300">
                <div className="w-3 h-3 bg-destructive rounded-full mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-muted-foreground">Gastos</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-destructive break-all">
                  {formatCurrency(dashboardData.totalGastos)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Compras</CardTitle>
            <ShoppingCart className="h-3 sm:h-4 w-3 sm:w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-accent break-all">
              {formatCurrency(dashboardData.totalCompras)}
            </div>
            <p className="text-xs text-muted-foreground">Todas las compras registradas</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Deudas Totales</CardTitle>
            <CreditCard className="h-3 sm:h-4 w-3 sm:w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-destructive break-all">
              {formatCurrency(dashboardData.totalDeudas)}
            </div>
            <p className="text-xs text-muted-foreground">Saldo pendiente por pagar</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Compras del Mes</CardTitle>
            <TrendingUp className="h-3 sm:h-4 w-3 sm:w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-secondary break-all">
              {formatCurrency(dashboardData.comprasDelMes)}
            </div>
            <p className="text-xs text-muted-foreground">Compras del mes actual</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Deudas Pendientes</CardTitle>
            <CreditCard className="h-3 sm:h-4 w-3 sm:w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-destructive">{dashboardData.deudasPendientes}</div>
            <p className="text-xs text-muted-foreground">Deudas con saldo pendiente</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Resumen de Ingresos vs Gastos */}
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <PieChart className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>Resumen Financiero</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Comparación de ingresos y gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-2 sm:p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors duration-300">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-2 sm:w-3 h-2 sm:h-3 bg-primary rounded-full"></div>
                  <span className="font-medium text-sm sm:text-base">Ingresos Totales</span>
                </div>
                <span className="font-bold text-primary text-sm sm:text-base break-all">
                  {formatCurrency(dashboardData.totalIngresos)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 bg-destructive/5 rounded-lg hover:bg-destructive/10 transition-colors duration-300">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-2 sm:w-3 h-2 sm:h-3 bg-destructive rounded-full"></div>
                  <span className="font-medium text-sm sm:text-base">Gastos Totales</span>
                </div>
                <span className="font-bold text-destructive text-sm sm:text-base break-all">
                  {formatCurrency(dashboardData.totalGastos)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded-lg border-2 border-dashed hover:border-solid transition-all duration-300">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <DollarSign className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="font-medium text-sm sm:text-base">Balance</span>
                </div>
                <span
                  className={`font-bold text-base sm:text-lg break-all ${dashboardData.saldoActual >= 0 ? "text-primary" : "text-destructive"
                    }`}
                >
                  {formatCurrency(dashboardData.saldoActual)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gastos por Categoría */}
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>Gastos por Categoría</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Desglose de tus gastos principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {dashboardData.gastosPorCategoria.map((categoria, index) => {
                const porcentaje =
                  dashboardData.totalGastos > 0 ? (categoria.valor / dashboardData.totalGastos) * 100 : 0

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs sm:text-sm">{categoria.categoria}</span>
                      <span className="font-bold text-sm sm:text-base break-all">
                        {formatCurrency(categoria.valor)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500 hover:h-3"
                        style={{
                          width: `${porcentaje}%`,
                          backgroundColor: categoria.color,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-right">{porcentaje.toFixed(1)}% del total</div>
                  </div>
                )
              })}

              {dashboardData.gastosPorCategoria.length === 0 && (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <BarChart3 className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay gastos registrados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>Últimas Transacciones</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Tus 5 transacciones más recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {dashboardData.ultimasTransacciones.map((transaccion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-300"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <span className="text-sm sm:text-lg flex-shrink-0">{getTypeIcon(transaccion.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm break-words">
                        {transaccion.detalle || transaccion.destino || "Sin descripción"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaccion.fecha).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <span className={`font-bold text-xs sm:text-sm break-all ${getTypeColor(transaccion.type)}`}>
                      {formatCurrency(transaccion.valor || 0)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(transaccion)}
                      className="hover:bg-primary/10 h-5 sm:h-6 w-5 sm:w-6 p-0"
                    >
                      <Eye className="w-2 sm:w-3 h-2 sm:h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {dashboardData.ultimasTransacciones.length === 0 && (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <TrendingUp className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay transacciones recientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <CreditCard className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>Deudas Prioritarias</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Deudas con mayor saldo pendiente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {dashboardData.proximosVencimientos.map((deuda, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 sm:p-3 bg-destructive/5 rounded-lg hover:bg-destructive/10 transition-colors duration-300"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <span className="text-sm sm:text-lg flex-shrink-0">💳</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm break-words">{deuda.detalle || "Sin descripción"}</p>
                      <p className="text-xs text-muted-foreground break-words">
                        {deuda.destino} • {new Date(deuda.fecha_inicio).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <span className="font-bold text-xs sm:text-sm text-destructive break-all">
                      {formatCurrency(deuda.saldo_actual)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(deuda)}
                      className="hover:bg-primary/10 h-5 sm:h-6 w-5 sm:w-6 p-0"
                    >
                      <Eye className="w-2 sm:w-3 h-2 sm:h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {dashboardData.proximosVencimientos.length === 0 && (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <CreditCard className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">¡No tienes deudas pendientes!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showDetails && selectedRecord && (
        <RecordDetails record={selectedRecord} isOpen={showDetails} onClose={() => setShowDetails(false)} />
      )}
    </div>
  )
}
