"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiService } from "@/services/apiService"
import { Plus, Calendar, DollarSign, TrendingUp, TrendingDown, Eye } from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RecordDetails from "@/components/data/RecordDetails"

export default function CajaManager() {
  const [cajas, setCajas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    fecha: new Date().toLocaleDateString("en-CA"),
    ingresos_dia: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadCajas()
  }, [])

  const loadCajas = async () => {
    try {
      const data = await apiService.cajas.getAll()
      setCajas(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
    } catch (error) {
      setError("Error al cargar las cajas")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      await apiService.createOrUpdateCaja({
        fecha: formData.fecha,
        ingresos_dia: Number.parseFloat(formData.ingresos_dia),
      })

      setSuccess("Caja creada/actualizada exitosamente")
      setFormData({
        fecha: new Date().toLocaleDateString("en-CA"),
        ingresos_dia: "",
      })
      setShowForm(false)
      loadCajas()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleViewDetails = (caja) => {
    setSelectedRecord({ ...caja, type: "caja" })
    setShowDetails(true)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Gestión de Caja</h1>
          <p className="text-muted-foreground">Administra los ingresos y saldos diarios</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary hover:opacity-90 transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Caja
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
            <CardTitle>Nueva Caja</CardTitle>
            <CardDescription>Ingresa los datos para crear o actualizar una caja diaria</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
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
                  <Label htmlFor="ingresos_dia">Ingresos del Día</Label>
                  <Input
                    id="ingresos_dia"
                    name="ingresos_dia"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.ingresos_dia}
                    onChange={handleChange}
                    className="bg-input/50 border-border/50 focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="gradient-primary">
                  Guardar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Cajas List */}
      <div className="grid gap-4">
        {cajas.map((caja) => (
          <Card
            key={caja._id}
            className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {new Date(caja.fecha).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Ingresos: ${caja.ingresos_dia.toLocaleString("es-ES")} | Gastos: $
                      {caja.total_gastos_dia.toLocaleString("es-ES")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-primary">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Ingresos</span>
                    </div>
                    <div className="text-xl font-bold text-primary">${caja.ingresos_dia.toLocaleString("es-ES")}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-destructive">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-sm font-medium">Gastos</span>
                    </div>
                    <div className="text-xl font-bold text-destructive">
                      ${caja.total_gastos_dia.toLocaleString("es-ES")}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-medium">Saldo</span>
                    </div>
                    <div className={`text-2xl font-bold ${caja.saldo_dia >= 0 ? "text-primary" : "text-destructive"}`}>
                      ${caja.saldo_dia.toLocaleString("es-ES")}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(caja)}
                      className="hover:bg-accent/10 hover:text-accent"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de detalles */}
      {showDetails && selectedRecord && (
        <RecordDetails record={selectedRecord} isOpen={showDetails} onClose={() => setShowDetails(false)} />
      )}

      {cajas.length === 0 && (
        <Card className="gradient-card border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay cajas registradas</h3>
            <p className="text-muted-foreground mb-4">Comienza creando tu primera caja diaria</p>
            <Button onClick={() => setShowForm(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Caja
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
