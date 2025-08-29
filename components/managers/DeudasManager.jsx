"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiService } from "@/services/apiService"
import { Plus, Edit, Trash2, CreditCard, Eye } from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getTodayLocalISO } from "../../utils/dateUtils"
import RecordDetails from "@/components/data/RecordDetails"

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
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadDeudas()
  }, [])

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
    })
    setEditingId(null)
    setShowForm(false)
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
          <h1 className="text-3xl font-bold text-primary">Deudas</h1>
          <p className="text-muted-foreground">Administra y controla tus deudas pendientes</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary hover:opacity-90 transition-all duration-300"
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

      {/* Form */}
      {showForm && (
        <Card className="gradient-card border-0 shadow-lg animate-fade-in-scale">
          <CardHeader>
            <CardTitle>{editingId ? "Editar" : "Nueva"} Deuda</CardTitle>
            <CardDescription>
              {editingId ? "Modifica los datos de la deuda" : "Ingresa los datos de la nueva deuda"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destino">Acreedor</Label>
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
                  <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
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
                <Label htmlFor="detalle">Detalle</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monto_total">Monto Total</Label>
                  <Input
                    id="monto_total"
                    name="monto_total"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.monto_total}
                    onChange={handleChange}
                    className="bg-input/50 border-border/50 focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saldo_actual">Saldo Actual</Label>
                  <Input
                    id="saldo_actual"
                    name="saldo_actual"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.saldo_actual}
                    onChange={handleChange}
                    className="bg-input/50 border-border/50 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="gradient-primary">
                  {editingId ? "Actualizar" : "Guardar"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
                          className="hover:bg-accent/10 hover:text-accent"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(deuda)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(deuda._id)}
                          className="hover:bg-destructive/10 hover:text-destructive"
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
            <Button onClick={() => setShowForm(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Deuda
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
