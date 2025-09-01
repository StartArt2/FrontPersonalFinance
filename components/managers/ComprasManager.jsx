"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiService } from "@/services/apiService"
import { Plus, Edit, Trash2, ShoppingCart, Eye } from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RecordDetails from "@/components/data/RecordDetails"
import MoneyInput from "@/components/ui/MoneyInput"

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
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

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
      const { fecha, valor, detalle, destino } = formData

      console.log("[DEBUG fecha]", fecha)
      const fechaFormateada = new Date(fecha).toISOString().split("T")[0]
      const compraData = {
        fecha: fechaFormateada,
        valor: Number(valor),
        detalle,
        ...(destino ? { destino } : {}),
      }

      console.log(">>> ENVIANDO:", JSON.stringify(compraData, null, 2))

      if (editingId) {
        await apiService.compras.update(editingId, compraData)
        setSuccess("Compra actualizada exitosamente")
      } else {
        const result = await apiService.compras.create(compraData)
        console.log("[v0] Compra creada:", result)
        setSuccess("Compra creada exitosamente")
      }

      resetForm()
      await loadCompras()
    } catch (error) {
      console.error("[v0] Error creando compra:", error)
      setError("Error al guardar la compra: " + (error.message || "Error desconocido"))
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

  const handleViewDetails = (compra) => {
    setSelectedRecord({ ...compra, type: "compra" })
    setShowDetails(true)
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

  const handleMoneyChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      valor: value,
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
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            🛒 <span>Compras</span>
          </h1>
          <p className="text-muted-foreground">Registra y administra todas tus compras</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background to-muted/30 border-0 shadow-2xl animate-scale-in">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                🛒 <span>{editingId ? "Editar" : "Nueva"} Compra</span>
              </CardTitle>
              <CardDescription>
                {editingId ? "Modifica los datos de la compra" : "Ingresa los datos de la nueva compra"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className="bg-background/50 border-border/50 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor" className="text-sm font-medium">
                      💰 Valor
                    </Label>
                    <MoneyInput
                      value={formData.valor}
                      onChange={handleMoneyChange}
                      placeholder="0"
                      className="bg-background/50 border-border/50 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detalle" className="text-sm font-medium">
                    📝 Detalle
                  </Label>
                  <Textarea
                    id="detalle"
                    name="detalle"
                    placeholder="Descripción de la compra"
                    value={formData.detalle}
                    onChange={handleChange}
                    className="bg-background/50 border-border/50 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destino" className="text-sm font-medium">
                    🏪 Destino (Opcional)
                  </Label>
                  <Input
                    id="destino"
                    name="destino"
                    placeholder="Ej: Supermercado, Tienda online, etc."
                    value={formData.destino}
                    onChange={handleChange}
                    className="bg-background/50 border-border/50 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {editingId ? "✅ Actualizar" : "💾 Guardar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1 hover:bg-muted/50 transition-all duration-300 bg-transparent"
                  >
                    ❌ Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4">
        {compras.map((compra) => (
          <Card
            key={compra._id}
            className="bg-gradient-to-r from-background to-blue-50/30 dark:to-blue-950/20 border border-blue-200/50 dark:border-blue-800/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:border-blue-300/70"
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-blue-200/50">
                    <ShoppingCart className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground break-words">{compra.detalle}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        📅{" "}
                        {new Date(compra.fecha).toLocaleDateString("es-ES", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {compra.destino && (
                        <span className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                          🏪 {compra.destino}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      }).format(compra.valor)}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(compra)}
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-300"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(compra)}
                      className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all duration-300"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(compra._id)}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-300"
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

      {/* Modal de detalles */}
      {showDetails && selectedRecord && (
        <RecordDetails record={selectedRecord} isOpen={showDetails} onClose={() => setShowDetails(false)} />
      )}

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
