"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiService } from "@/services/apiService"
import { Plus, Edit, Trash2, DollarSign } from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AbonosManager() {
  const [abonos, setAbonos] = useState([])
  const [deudas, setDeudas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    deuda_id: "",
    fecha: new Date().toISOString().split("T")[0],
    valor: "",
    detalle: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadData()
  }, [])

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

  const resetForm = () => {
    setFormData({
      deuda_id: "",
      fecha: new Date().toISOString().split("T")[0],
      valor: "",
      detalle: "",
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
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Abonos</h1>
          <p className="text-muted-foreground">Registra los pagos realizados a tus deudas</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary hover:opacity-90 transition-all duration-300"
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

      {/* Form */}
      {showForm && (
        <Card className="gradient-card border-0 shadow-lg animate-fade-in-scale">
          <CardHeader>
            <CardTitle>{editingId ? "Editar" : "Nuevo"} Abono</CardTitle>
            <CardDescription>
              {editingId ? "Modifica los datos del abono" : "Ingresa los datos del nuevo abono"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deuda_id">Deuda</Label>
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
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  <Label htmlFor="valor">Valor del Abono</Label>
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
                <Label htmlFor="detalle">Detalle (Opcional)</Label>
                <Textarea
                  id="detalle"
                  name="detalle"
                  placeholder="Observaciones sobre el abono"
                  value={formData.detalle}
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
                        {new Date(abono.fecha).toISOString().split("T")[0]}
                        {deudaInfo && ` • ${deudaInfo.destino}`}
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
                        onClick={() => handleEdit(abono)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(abono._id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
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

      {abonos.length === 0 && deudas.length > 0 && (
        <Card className="gradient-card border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay abonos registrados</h3>
            <p className="text-muted-foreground mb-4">Comienza registrando los pagos a tus deudas</p>
            <Button onClick={() => setShowForm(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Primer Abono
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
