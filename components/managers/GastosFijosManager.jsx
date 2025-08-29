"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiService } from "@/services/apiService"
import { Plus, Edit, Trash2, TrendingDown, Eye } from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getTodayLocalISO } from "../../utils/dateUtils"
import RecordDetails from "@/components/data/RecordDetails"

export default function GastosFijosManager() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    fecha: getTodayLocalISO(),
    valor: "",
    detalle: "",
    destino: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadGastos()
  }, [])

  const loadGastos = async () => {
    try {
      const data = await apiService.gastosFijos.getAll()
      setGastos(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
    } catch (error) {
      setError("Error al cargar los gastos fijos")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const gastoData = {
        ...formData,
        valor: Number.parseFloat(formData.valor),
      }

      if (editingId) {
        await apiService.gastosFijos.update(editingId, gastoData)
        setSuccess("Gasto fijo actualizado exitosamente")
      } else {
        await apiService.gastosFijos.create(gastoData)
        console.log(gastoData)
        setSuccess("Gasto fijo creado exitosamente")
      }

      resetForm()
      loadGastos()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleEdit = (gasto) => {
    setFormData({
      fecha: new Date(gasto.fecha).toISOString().split("T")[0],
      valor: gasto.valor.toString(),
      detalle: gasto.detalle,
      destino: gasto.destino || "",
    })
    setEditingId(gasto._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este gasto fijo?")) {
      try {
        await apiService.gastosFijos.delete(id)
        setSuccess("Gasto fijo eliminado exitosamente")
        loadGastos()
      } catch (error) {
        setError(error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      fecha: getTodayLocalISO(),
      valor: "",
      detalle: "",
      destino: "",
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

  const handleViewDetails = (gasto) => {
    setSelectedRecord({ ...gasto, type: "gastoFijo" })
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
          {/* Changed from bg-gradient-primary bg-clip-text text-transparent to text-primary for making the title visible */}
          <h1 className="text-3xl font-bold text-primary">Gastos Fijos</h1>
          <p className="text-muted-foreground">Administra tus gastos fijos mensuales</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary hover:opacity-90 transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Gasto Fijo
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
            <CardTitle>{editingId ? "Editar" : "Nuevo"} Gasto Fijo</CardTitle>
            <CardDescription>
              {editingId ? "Modifica los datos del gasto fijo" : "Ingresa los datos del nuevo gasto fijo"}
            </CardDescription>
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
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    name="valor"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.valor}
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
                  placeholder="Descripción del gasto fijo"
                  value={formData.detalle}
                  onChange={handleChange}
                  className="bg-input/50 border-border/50 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destino">Destino (Opcional)</Label>
                <Input
                  id="destino"
                  name="destino"
                  placeholder="Ej: Banco, Empresa, etc."
                  value={formData.destino}
                  onChange={handleChange}
                  className="bg-input/50 border-border/50 focus:border-primary"
                />
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

      {/* Gastos List */}
      <div className="grid gap-4">
        {gastos.map((gasto) => (
          <Card
            key={gasto._id}
            className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{gasto.detalle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(gasto.fecha).toLocaleDateString("es-ES")}
                      {gasto.destino && ` • ${gasto.destino}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-destructive">${gasto.valor.toLocaleString("es-ES")}</div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(gasto)}
                      className="hover:bg-accent/10 hover:text-accent"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(gasto)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(gasto._id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showDetails && selectedRecord && (
        <RecordDetails record={selectedRecord} isOpen={showDetails} onClose={() => setShowDetails(false)} />
      )}

      {gastos.length === 0 && (
        <Card className="gradient-card border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <TrendingDown className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay gastos fijos registrados</h3>
            <p className="text-muted-foreground mb-4">Comienza agregando tus gastos fijos mensuales</p>
            <Button onClick={() => setShowForm(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Gasto Fijo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
