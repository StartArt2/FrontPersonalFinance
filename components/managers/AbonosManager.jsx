"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiService } from "@/services/apiService"
import { Plus, Edit, Trash2, DollarSign, Eye, Calculator } from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RecordDetails from "@/components/data/RecordDetails"
import MoneyInput from "@/components/ui/MoneyInput"

export default function AbonosManager() {
  const [abonos, setAbonos] = useState([])
  const [deudas, setDeudas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [formData, setFormData] = useState({
    deuda_id: "",
    fecha: new Date().toISOString().split("T")[0],
    valor: "",
    detalle: "",
    tipo_abono: "manual", // manual, porcentaje_saldo, cuota_calculada
    porcentaje_saldo: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [calculatedPayment, setCalculatedPayment] = useState({
    valor_calculado: 0,
    descripcion: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (formData.tipo_abono === "porcentaje_saldo" && formData.deuda_id && formData.porcentaje_saldo) {
      calculatePercentagePayment()
    } else if (formData.tipo_abono === "cuota_calculada" && formData.deuda_id) {
      calculateMonthlyPayment()
    }
  }, [formData.tipo_abono, formData.deuda_id, formData.porcentaje_saldo])

  const calculatePercentagePayment = () => {
    const deuda = deudas.find((d) => d._id === formData.deuda_id)
    if (deuda && formData.porcentaje_saldo) {
      const porcentaje = Number.parseFloat(formData.porcentaje_saldo) || 0
      const valorCalculado = Math.round((deuda.saldo_actual * porcentaje) / 100)

      setCalculatedPayment({
        valor_calculado: valorCalculado,
        descripcion: `${porcentaje}% del saldo actual ($${deuda.saldo_actual.toLocaleString("es-ES")})`,
      })

      setFormData((prev) => ({
        ...prev,
        valor: valorCalculado.toString(),
        detalle: `Abono del ${porcentaje}% del saldo`,
      }))
    }
  }

  const calculateMonthlyPayment = () => {
    const deuda = deudas.find((d) => d._id === formData.deuda_id)
    if (
      deuda &&
      deuda.tipo_prestamo === "porcentaje" &&
      deuda.capital_inicial &&
      deuda.porcentaje_interes &&
      deuda.plazo_meses
    ) {
      const capital = deuda.capital_inicial
      const tasaMensual = deuda.porcentaje_interes / 100 / 12
      const plazo = deuda.plazo_meses

      const cuotaMensual =
        (capital * (tasaMensual * Math.pow(1 + tasaMensual, plazo))) / (Math.pow(1 + tasaMensual, plazo) - 1)

      const valorCalculado = Math.round(cuotaMensual)

      setCalculatedPayment({
        valor_calculado: valorCalculado,
        descripcion: `Cuota mensual calculada (${deuda.porcentaje_interes}% anual, ${deuda.plazo_meses} meses)`,
      })

      setFormData((prev) => ({
        ...prev,
        valor: valorCalculado.toString(),
        detalle: "Cuota mensual programada",
      }))
    }
  }

  const loadData = async () => {
    try {
      const [abonosData, deudasData] = await Promise.all([apiService.abonos.getAll(), apiService.deudas.getAll()])
      setAbonos(abonosData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
      setDeudas(deudasData.filter((deuda) => deuda.saldo_actual > 0))
    } catch (error) {
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const abonoData = {
        ...formData,
        valor: Number.parseFloat(formData.valor),
        tipo_abono: formData.tipo_abono,
        porcentaje_aplicado:
          formData.tipo_abono === "porcentaje_saldo" ? Number.parseFloat(formData.porcentaje_saldo) : null,
      }

      if (editingId) {
        await apiService.abonos.update(editingId, abonoData)
        setSuccess("Abono actualizado exitosamente")
      } else {
        await apiService.abonos.create(abonoData)
        setSuccess("Abono creado exitosamente")
      }

      resetForm()
      loadData()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleEdit = (abono) => {
    setFormData({
      deuda_id: abono.deuda_id._id || abono.deuda_id,
      fecha: new Date(abono.fecha).toISOString().split("T")[0],
      valor: abono.valor.toString(),
      detalle: abono.detalle || "",
      tipo_abono: abono.tipo_abono || "manual",
      porcentaje_saldo: abono.porcentaje_aplicado?.toString() || "",
    })
    setEditingId(abono._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este abono?")) {
      try {
        await apiService.abonos.delete(id)
        setSuccess("Abono eliminado exitosamente")
        loadData()
      } catch (error) {
        setError(error.message)
      }
    }
  }

  const handleViewDetails = (abono) => {
    setSelectedRecord({ ...abono, type: "abono" })
    setShowDetails(true)
  }

  const resetForm = () => {
    setFormData({
      deuda_id: "",
      fecha: new Date().toISOString().split("T")[0],
      valor: "",
      detalle: "",
      tipo_abono: "manual",
      porcentaje_saldo: "",
    })
    setEditingId(null)
    setShowForm(false)
    setCalculatedPayment({
      valor_calculado: 0,
      descripcion: "",
    })
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const getDeudaInfo = (deudaId) => {
    const deuda = deudas.find((d) => d._id === deudaId)
    return deuda || null
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">💰 Abonos</h1>
          <p className="text-muted-foreground">Registra los pagos realizados a tus deudas</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary hover:opacity-90 transition-all duration-300 hover:scale-105"
          disabled={deudas.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Abono
        </Button>
      </div>

      {deudas.length === 0 && (
        <Alert className="border-accent/50 bg-accent/10">
          <AlertDescription className="text-accent">
            No tienes deudas pendientes para abonar. ¡Felicitaciones!
          </AlertDescription>
        </Alert>
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

      {/* Floating Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto gradient-card border-0 shadow-2xl animate-fade-in-scale">
            <CardHeader className="gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {editingId ? "✏️ Editar Abono" : "➕ Nuevo Abono"}
              </CardTitle>
              <CardDescription className="text-white/80">
                {editingId ? "Modifica los datos del abono" : "Ingresa los datos del nuevo abono"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="deuda_id">🏦 Deuda</Label>
                  <Select
                    value={formData.deuda_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, deuda_id: value }))}
                    required
                  >
                    <SelectTrigger className="bg-input/50 border-border/50 focus:border-primary">
                      <SelectValue placeholder="Selecciona una deuda" />
                    </SelectTrigger>
                    <SelectContent>
                      {deudas.map((deuda) => (
                        <SelectItem key={deuda._id} value={deuda._id}>
                          {deuda.destino} - ${deuda.saldo_actual.toLocaleString("es-ES")} pendiente
                          {deuda.tipo_prestamo === "porcentaje" && (
                            <span className="text-xs text-accent ml-2">📊 {deuda.porcentaje_interes}%</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_abono" className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Tipo de Abono
                  </Label>
                  <Select
                    value={formData.tipo_abono}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo_abono: value }))}
                  >
                    <SelectTrigger className="bg-input/50 border-border/50 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">✏️ Valor Manual</SelectItem>
                      <SelectItem value="porcentaje_saldo">📊 % del Saldo</SelectItem>
                      <SelectItem value="cuota_calculada">🧮 Cuota Calculada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo_abono === "porcentaje_saldo" && (
                  <div className="space-y-2">
                    <Label htmlFor="porcentaje_saldo">📈 Porcentaje del Saldo (%)</Label>
                    <Input
                      id="porcentaje_saldo"
                      name="porcentaje_saldo"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      placeholder="10"
                      value={formData.porcentaje_saldo}
                      onChange={handleChange}
                      className="bg-input/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                )}

                {calculatedPayment.valor_calculado > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                        <Calculator className="w-4 h-4" />💡 Cálculo Automático
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">{calculatedPayment.descripcion}</p>
                      <p className="text-2xl font-bold text-primary">
                        ${calculatedPayment.valor_calculado.toLocaleString("es-ES")}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">📅 Fecha</Label>
                    <Input
                      id="fecha"
                      name="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={handleChange}
                      className="bg-input/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor">💵 Valor del Abono</Label>
                    <MoneyInput
                      value={formData.valor}
                      onChange={(value) => setFormData((prev) => ({ ...prev, valor: value }))}
                      placeholder="0"
                      className="bg-input/50 border-border/50 focus:border-primary"
                      required
                      disabled={formData.tipo_abono !== "manual"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detalle">📝 Detalle (Opcional)</Label>
                  <Textarea
                    id="detalle"
                    name="detalle"
                    placeholder="Observaciones sobre el abono"
                    value={formData.detalle}
                    onChange={handleChange}
                    className="bg-input/50 border-border/50 focus:border-primary"
                  />
                </div>

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

      {/* Abonos List */}
      <div className="grid gap-4">
        {abonos.map((abono) => {
          const deudaInfo = getDeudaInfo(abono.deuda_id._id || abono.deuda_id)

          return (
            <Card
              key={abono._id}
              className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{deudaInfo ? deudaInfo.detalle : "Deuda eliminada"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(abono.fecha).toLocaleDateString("es-ES")}
                        {deudaInfo && ` • ${deudaInfo.destino}`}
                        {abono.tipo_abono === "porcentaje_saldo" && (
                          <span className="ml-2 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                            📊 {abono.porcentaje_aplicado}% del saldo
                          </span>
                        )}
                        {abono.tipo_abono === "cuota_calculada" && (
                          <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            🧮 Cuota calculada
                          </span>
                        )}
                      </p>
                      {abono.detalle && <p className="text-sm text-muted-foreground mt-1">{abono.detalle}</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">${abono.valor.toLocaleString("es-ES")}</div>
                      {deudaInfo && (
                        <div className="text-sm text-muted-foreground">
                          Saldo: ${deudaInfo.saldo_actual.toLocaleString("es-ES")}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(abono)}
                        className="hover:bg-accent/10 hover:text-accent hover:scale-105 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(abono)}
                        className="hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(abono._id)}
                        className="hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal de detalles del registro */}
      {showDetails && selectedRecord && (
        <RecordDetails record={selectedRecord} isOpen={showDetails} onClose={() => setShowDetails(false)} />
      )}

      {abonos.length === 0 && deudas.length > 0 && (
        <Card className="gradient-card border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay abonos registrados</h3>
            <p className="text-muted-foreground mb-4">Comienza registrando los pagos a tus deudas</p>
            <Button onClick={() => setShowForm(true)} className="gradient-primary hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Primer Abono
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
