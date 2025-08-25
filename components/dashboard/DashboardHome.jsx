"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiService } from "@/services/apiService"
import { TrendingUp, TrendingDown, DollarSign, Calendar, LucidePieChart, BarChart3 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts"
import LoadingSpinner from "@/components/ui/LoadingSpinner"

export default function DashboardHome() {
  const [cajas, setCajas] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    saldoActual: 0,
    ingresosMes: 0,
    gastosMes: 0,
    tendencia: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [cajasData, gastosFijos, gastosVariables, compras] = await Promise.all([
        apiService.cajas.getAll(),
        apiService.gastosFijos.getAll(),
        apiService.gastosVariables.getAll(),
        apiService.compras.getAll(),
      ])

      setCajas(cajasData)

      // Calculate stats
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const currentMonthCajas = cajasData.filter((caja) => {
        const cajaDate = new Date(caja.fecha)
        return cajaDate.getMonth() === currentMonth && cajaDate.getFullYear() === currentYear
      })

      const saldoActual = cajasData.length > 0 ? cajasData[cajasData.length - 1].saldo_dia : 0
      const ingresosMes = currentMonthCajas.reduce((sum, caja) => sum + caja.ingresos_dia, 0)
      const gastosMes = currentMonthCajas.reduce((sum, caja) => sum + caja.total_gastos_dia, 0)

      setStats({
        saldoActual,
        ingresosMes,
        gastosMes,
        tendencia: ingresosMes - gastosMes,
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const chartData = cajas.slice(-7).map((caja) => ({
    fecha: new Date(caja.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
    saldo: caja.saldo_dia,
    ingresos: caja.ingresos_dia,
    gastos: caja.total_gastos_dia,
  }))

  const pieData = [
    { name: "Ingresos", value: stats.ingresosMes, color: "#22c55e" },
    { name: "Gastos", value: stats.gastosMes, color: "#ef4444" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Dashboard Financiero</h1>
        <p className="text-muted-foreground">Resumen de tu situación financiera actual</p>
      </div>

      {/* Main Balance Card */}
      <Card className="gradient-card border-0 shadow-xl animate-pulse-glow">
        <CardHeader className="text-center">
          <CardTitle className="text-lg text-muted-foreground">Saldo Actual</CardTitle>
          <div className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            ${stats.saldoActual.toLocaleString("es-ES")}
          </div>
          <CardDescription className="flex items-center justify-center space-x-2">
            {stats.tendencia >= 0 ? (
              <TrendingUp className="w-4 h-4 text-primary" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span className={stats.tendencia >= 0 ? "text-primary" : "text-destructive"}>
              ${Math.abs(stats.tendencia).toLocaleString("es-ES")} este mes
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${stats.ingresosMes.toLocaleString("es-ES")}</div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${stats.gastosMes.toLocaleString("es-ES")}</div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Mensual</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.tendencia >= 0 ? "text-primary" : "text-destructive"}`}>
              ${stats.tendencia.toLocaleString("es-ES")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Evolución Semanal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="fecha" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ fill: "var(--primary)", strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="var(--secondary)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="gastos"
                  stroke="var(--destructive)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LucidePieChart className="w-5 h-5" />
              <span>Distribución Mensual</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString("es-ES")}`, ""]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-sm text-muted-foreground">Ingresos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <span className="text-sm text-muted-foreground">Gastos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="gradient-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Últimas Cajas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cajas
              .slice(-5)
              .reverse()
              .map((caja, index) => (
                <div
                  key={caja._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(caja.fecha).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ingresos: ${caja.ingresos_dia.toLocaleString("es-ES")} | Gastos: $
                      {caja.total_gastos_dia.toLocaleString("es-ES")}
                    </p>
                  </div>
                  <div className={`text-lg font-bold ${caja.saldo_dia >= 0 ? "text-primary" : "text-destructive"}`}>
                    ${caja.saldo_dia.toLocaleString("es-ES")}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
