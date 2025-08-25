"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiService } from "@/services/apiService"
import { Plus, Edit, Trash2, ShoppingCart } from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ComprasManager() {
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    valor: "",
    detalle: "",
    destino: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadCompras()
  }, [])

  const loadCompras = async () => {
    try {
      const data = await apiService.compras.getAll()
      setCompras(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
    } catch (error) {
      setError("Error al cargar las compras")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const compraData = {
        ...formData,
        valor: Number.parseFloat(formData.valor),
      }

      if (editingId) {
        await apiService.compras.update(editingId, compraData)
        setSuccess("Compra actualizada exitosamente")
      } else {
        await apiService.compras.create(compraData)
        console.log(compraData)
        setSuccess("Compra creada exitosamente")
      }

      resetForm()
      loadCompras()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleEdit = (compra) => {
    setFormData({
      fecha: new Date(compra.fecha).toISOString().split("T")[0],
      valor: compra.valor.toString(),
      detalle: compra.detalle,
      destino: compra.destino || "",
    })
    setEditingId(compra._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta compra?")) {
      try {
        await apiService.compras.delete(id)
        setSuccess("Compra eliminada exitosamente")
        loadCompras()
      } catch (error) {
        setError(error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split("T")[0],
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

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Compras</h1>
          <p className="text-muted-foreground">Registra y administra todas tus compras</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary hover:opacity-90 transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Compra
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
            <CardTitle>{editingId ? "Editar" : "Nueva"} Compra</CardTitle>
            <CardDescription>
              {editingId ? "Modifica los datos de la compra" : "Ingresa los datos de la nueva compra"}
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
                  placeholder="Descripción de la compra"
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
                  placeholder="Ej: Supermercado, Tienda online, etc."
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

      {/* Compras List */}
      <div className="grid gap-4">
        {compras.map((compra) => (
          <Card
            key={compra._id}
            className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{compra.detalle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(compra.fecha).toISOString().split("T")[0]}
                      {compra.destino && ` • ${compra.destino}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-accent">${compra.valor.toLocaleString("es-ES")}</div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(compra)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(compra._id)}
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

      {compras.length === 0 && (
        <Card className="gradient-card border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay compras registradas</h3>
            <p className="text-muted-foreground mb-4">Comienza registrando tus compras diarias</p>
            <Button onClick={() => setShowForm(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Primera Compra
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
