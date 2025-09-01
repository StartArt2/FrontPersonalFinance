"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiService } from "@/services/apiService"
import { Plus, Edit, Trash2, CreditCard, Eye, Calculator } from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getTodayLocalISO } from "../../utils/dateUtils"
import RecordDetails from "@/components/data/RecordDetails"
import MoneyInput from "@/components/ui/MoneyInput"

export default function DeudasManager() {
  const [deudas, setDeudas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    detalle: "",
    destino: "",
    monto_total: "",
    saldo_actual: "",
    fecha_inicio: getTodayLocalISO(),
    tipo_prestamo: "fijo", // fijo o porcentaje
    porcentaje_interes: "",
    plazo_meses: "",
    capital_inicial: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  const [calculatedValues, setCalculatedValues] = useState({
    cuota_mensual: 0,
    total_intereses: 0,
    monto_total_calculado: 0,
  })

  useEffect(() => {
    loadDeudas()
  }, [])

  useEffect(() => {
    if (
      formData.tipo_prestamo === "porcentaje" &&
      formData.capital_inicial &&
      formData.porcentaje_interes &&
      formData.plazo_meses
    ) {
      calculateLoanValues()
    }
  }, [formData.capital_inicial, formData.porcentaje_interes, formData.plazo_meses, formData.tipo_prestamo])

  const calculateLoanValues = () => {
    const capital = Number.parseFloat(formData.capital_inicial) || 0
    const tasaMensual = (Number.parseFloat(formData.porcentaje_interes) || 0) / 100 / 12
    const plazo = Number.parseInt(formData.plazo_meses) || 0

    if (capital > 0 && tasaMensual > 0 && plazo > 0) {
      // Fórmula de cuota fija (sistema francés)
      const cuotaMensual =
        (capital * (tasaMensual * Math.pow(1 + tasaMensual, plazo))) / (Math.pow(1 + tasaMensual, plazo) - 1)

      const totalIntereses = cuotaMensual * plazo - capital
      const montoTotal = capital + totalIntereses

      setCalculatedValues({
        cuota_mensual: Math.round(cuotaMensual),
        total_intereses: Math.round(totalIntereses),
        monto_total_calculado: Math.round(montoTotal),
      })

      // Auto-fill monto_total and saldo_actual
      setFormData((prev) => ({
        ...prev,
        monto_total: Math.round(montoTotal).toString(),
        saldo_actual: Math.round(montoTotal).toString(),
      }))
    }
  }

  const loadDeudas = async () => {
    try {
      const data = await apiService.deudas.getAll()
      setDeudas(data.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio)))
    } catch (error) {
      setError("Error al cargar las deudas")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const deudaData = {
        ...formData,
        monto_total: Number.parseFloat(formData.monto_total),
        saldo_actual: Number.parseFloat(formData.saldo_actual),
        porcentaje_interes:
          formData.tipo_prestamo === "porcentaje" ? Number.parseFloat(formData.porcentaje_interes) : null,
        plazo_meses: formData.tipo_prestamo === "porcentaje" ? Number.parseInt(formData.plazo_meses) : null,
        capital_inicial: formData.tipo_prestamo === "porcentaje" ? Number.parseFloat(formData.capital_inicial) : null,
      }

      if (editingId) {
        await apiService.deudas.update(editingId, deudaData)
        setSuccess("Deuda actualizada exitosamente")
      } else {
        await apiService.deudas.create(deudaData)
        setSuccess("Deuda creada exitosamente")
      }

      resetForm()
      loadDeudas()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleEdit = (deuda) => {
    setFormData({
      detalle: deuda.detalle,
      destino: deuda.destino,
      monto_total: deuda.monto_total.toString(),
      saldo_actual: deuda.saldo_actual.toString(),
      fecha_inicio: new Date(deuda.fecha_inicio).toISOString().split("T")[0],
      tipo_prestamo: deuda.tipo_prestamo || "fijo",
      porcentaje_interes: deuda.porcentaje_interes?.toString() || "",
      plazo_meses: deuda.plazo_meses?.toString() || "",
      capital_inicial: deuda.capital_inicial?.toString() || "",
    })
    setEditingId(deuda._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta deuda?")) {
      try {
        await apiService.deudas.delete(id)
        setSuccess("Deuda eliminada exitosamente")
        loadDeudas()
      } catch (error) {
        setError(error.message)
      }
    }
  }

  const handleViewDetails = (deuda) => {
    setSelectedRecord({ ...deuda, type: "deuda" })
    setShowDetails(true)
  }

  const resetForm = () => {
    setFormData({
      detalle: "",
      destino: "",
      monto_total: "",
      saldo_actual: "",
      fecha_inicio: getTodayLocalISO(),
      tipo_prestamo: "fijo",
      porcentaje_interes: "",
      plazo_meses: "",
      capital_inicial: "",
    })
    setEditingId(null)
    setShowForm(false)
    setCalculatedValues({
      cuota_mensual: 0,
      total_intereses: 0,
      monto_total_calculado: 0,
    })
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const getDeudaStatus = (deuda) => {
    const porcentajePagado = ((deuda.monto_total - deuda.saldo_actual) / deuda.monto_total) * 100
    if (porcentajePagado === 100) return { status: "Pagada", color: "text-primary", bg: "bg-primary/10" }
    if (porcentajePagado >= 75) return { status: "Casi Pagada", color: "text-secondary", bg: "bg-secondary/10" }
    if (porcentajePagado >= 50) return { status: "En Progreso", color: "text-accent", bg: "bg-accent/10" }
    return { status: "Pendiente", color: "text-destructive", bg: "bg-destructive/10" }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">💳 Deudas</h1>
          <p className="text-muted-foreground">Administra y controla tus deudas pendientes</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary hover:opacity-90 transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Deuda
        </Button>
      </div>

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

      {/* Floating Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto gradient-card border-0 shadow-2xl animate-fade-in-scale">
            <CardHeader className="gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {editingId ? "✏️ Editar Deuda" : "➕ Nueva Deuda"}
              </CardTitle>
              <CardDescription className="text-white/80">
                {editingId ? "Modifica los datos de la deuda" : "Ingresa los datos de la nueva deuda"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tipo_prestamo" className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Tipo de Préstamo
                  </Label>
                  <Select
                    value={formData.tipo_prestamo}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo_prestamo: value }))}
                  >
                    <SelectTrigger className="bg-input/50 border-border/50 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fijo">💰 Monto Fijo</SelectItem>
                      <SelectItem value="porcentaje">📊 Con Interés (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="destino">🏦 Acreedor</Label>
                    <Input
                      id="destino"
                      name="destino"
                      placeholder="Ej: Banco, Persona, Empresa"
                      value={formData.destino}
                      onChange={handleChange}
                      className="bg-input/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_inicio">📅 Fecha de Inicio</Label>
                    <Input
                      id="fecha_inicio"
                      name="fecha_inicio"
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={handleChange}
                      className="bg-input/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detalle">📝 Detalle</Label>
                  <Textarea
                    id="detalle"
                    name="detalle"
                    placeholder="Descripción de la deuda"
                    value={formData.detalle}
                    onChange={handleChange}
                    className="bg-input/50 border-border/50 focus:border-primary"
                    required
                  />
                </div>

                {formData.tipo_prestamo === "porcentaje" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capital_inicial">💵 Capital Inicial</Label>
                        <MoneyInput
                          value={formData.capital_inicial}
                          onChange={(value) => setFormData((prev) => ({ ...prev, capital_inicial: value }))}
                          placeholder="0"
                          className="bg-input/50 border-border/50 focus:border-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="porcentaje_interes">📈 Interés Anual (%)</Label>
                        <Input
                          id="porcentaje_interes"
                          name="porcentaje_interes"
                          type="number"
                          step="0.01"
                          placeholder="12.5"
                          value={formData.porcentaje_interes}
                          onChange={handleChange}
                          className="bg-input/50 border-border/50 focus:border-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plazo_meses">⏰ Plazo (meses)</Label>
                        <Input
                          id="plazo_meses"
                          name="plazo_meses"
                          type="number"
                          placeholder="12"
                          value={formData.plazo_meses}
                          onChange={handleChange}
                          className="bg-input/50 border-border/50 focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    {calculatedValues.monto_total_calculado > 0 && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                            <Calculator className="w-4 h-4" />📊 Cálculos Automáticos
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-muted-foreground">Cuota Mensual</p>
                              <p className="text-lg font-bold text-primary">
                                ${calculatedValues.cuota_mensual.toLocaleString("es-ES")}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Total Intereses</p>
                              <p className="text-lg font-bold text-accent">
                                ${calculatedValues.total_intereses.toLocaleString("es-ES")}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Monto Total</p>
                              <p className="text-lg font-bold text-destructive">
                                ${calculatedValues.monto_total_calculado.toLocaleString("es-ES")}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monto_total">💰 Monto Total</Label>
                      <MoneyInput
                        value={formData.monto_total}
                        onChange={(value) => setFormData((prev) => ({ ...prev, monto_total: value }))}
                        placeholder="0"
                        className="bg-input/50 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saldo_actual">💳 Saldo Actual</Label>
                      <MoneyInput
                        value={formData.saldo_actual}
                        onChange={(value) => setFormData((prev) => ({ ...prev, saldo_actual: value }))}
                        placeholder="0"
                        className="bg-input/50 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="gradient-primary hover:scale-105 transition-transform">
                    {editingId ? "✅ Actualizar" : "💾 Guardar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="hover:scale-105 transition-transform bg-transparent"
                  >
                    ❌ Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deudas List */}
      <div className="grid gap-4">
        {deudas.map((deuda) => {
          const status = getDeudaStatus(deuda)
          const porcentajePagado = ((deuda.monto_total - deuda.saldo_actual) / deuda.monto_total) * 100

          return (
            <Card
              key={deuda._id}
              className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{deuda.detalle}</h3>
                        <p className="text-sm text-muted-foreground">
                          {deuda.destino} • {new Date(deuda.fecha_inicio).toLocaleDateString("es-ES")}
                          {deuda.tipo_prestamo === "porcentaje" && (
                            <span className="ml-2 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                              📊 {deuda.porcentaje_interes}% anual
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.status}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(deuda)}
                          className="hover:bg-accent/10 hover:text-accent hover:scale-105 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(deuda)}
                          className="hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(deuda._id)}
                          className="hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Monto Total</p>
                      <p className="text-xl font-bold text-foreground">${deuda.monto_total.toLocaleString("es-ES")}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Saldo Actual</p>
                      <p className="text-xl font-bold text-destructive">
                        ${deuda.saldo_actual.toLocaleString("es-ES")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Pagado</p>
                      <p className="text-xl font-bold text-primary">{porcentajePagado.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${porcentajePagado}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {showDetails && selectedRecord && (
        <RecordDetails record={selectedRecord} isOpen={showDetails} onClose={() => setShowDetails(false)} />
      )}

      {deudas.length === 0 && (
        <Card className="gradient-card border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay deudas registradas</h3>
            <p className="text-muted-foreground mb-4">¡Excelente! No tienes deudas pendientes</p>
            <Button onClick={() => setShowForm(true)} className="gradient-primary hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Deuda
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
