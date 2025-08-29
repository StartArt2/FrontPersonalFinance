"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  CreditCard,
  User,
  Wallet,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Database,
  History,
} from "lucide-react"
import { apiService } from "@/services/apiService"

export default function RecordDetails({ record, isOpen, onClose }) {
  const [relatedAbonos, setRelatedAbonos] = useState([])
  const [loadingAbonos, setLoadingAbonos] = useState(false)
  const [dayExpenses, setDayExpenses] = useState({
    gastosFijos: [],
    gastosVariables: [],
    compras: [],
    deudas: [],
    abonos: [],
  })
  const [loadingDayExpenses, setLoadingDayExpenses] = useState(false)

  const [shouldLoadAbonos, setShouldLoadAbonos] = useState(false)
  const [shouldLoadDayExpenses, setShouldLoadDayExpenses] = useState(false)

  useEffect(() => {
    setShouldLoadAbonos(record.type === "deuda" && record._id && isOpen)
    setShouldLoadDayExpenses(record.type === "caja" && record.fecha && isOpen)
  }, [record, isOpen])

  useEffect(() => {
    if (shouldLoadAbonos) {
      loadRelatedAbonos()
    }
  }, [shouldLoadAbonos])

  useEffect(() => {
    if (shouldLoadDayExpenses) {
      loadDayExpenses()
    }
  }, [shouldLoadDayExpenses])

  const loadRelatedAbonos = async () => {
    setLoadingAbonos(true)
    try {
      const abonos = await apiService.abonos.getAll()
      // Filtrar abonos que pertenecen a esta deuda
      const filteredAbonos = abonos.filter((abono) => {
        const deudaId = typeof abono.deuda_id === "object" ? abono.deuda_id._id : abono.deuda_id
        return deudaId === record._id
      })
      setRelatedAbonos(filteredAbonos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
    } catch (error) {
      console.error("Error al cargar abonos relacionados:", error)
      setRelatedAbonos([])
    } finally {
      setLoadingAbonos(false)
    }
  }

  const loadDayExpenses = async () => {
    setLoadingDayExpenses(true)
    try {
      const targetDate = new Date(record.fecha).toISOString().split("T")[0]

      // Cargar todos los tipos de registros del día
      const [gastosFijos, gastosVariables, compras, deudas, abonos] = await Promise.all([
        apiService.gastosFijos.getAll(),
        apiService.gastosVariables.getAll(),
        apiService.compras.getAll(),
        apiService.deudas.getAll(),
        apiService.abonos.getAll(),
      ])

      // Filtrar por fecha
      const filterByDate = (items) =>
        items.filter((item) => {
          const itemDate = new Date(item.fecha || item.fecha_inicio).toISOString().split("T")[0]
          return itemDate === targetDate
        })

      setDayExpenses({
        gastosFijos: filterByDate(gastosFijos),
        gastosVariables: filterByDate(gastosVariables),
        compras: filterByDate(compras),
        deudas: filterByDate(deudas),
        abonos: filterByDate(abonos),
      })
    } catch (error) {
      console.error("Error al cargar gastos del día:", error)
      setDayExpenses({
        gastosFijos: [],
        gastosVariables: [],
        compras: [],
        deudas: [],
        abonos: [],
      })
    } finally {
      setLoadingDayExpenses(false)
    }
  }

  const getTypeInfo = (type) => {
    const typeInfo = {
      caja: {
        label: "Caja Diaria",
        icon: Wallet,
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        bgGradient: "from-emerald-500/5 to-emerald-600/5",
        description: "Registro de ingresos y gastos diarios",
      },
      compra: {
        label: "Compra",
        icon: ShoppingCart,
        color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        bgGradient: "from-blue-500/5 to-blue-600/5",
        description: "Registro de compras realizadas",
      },
      gastoFijo: {
        label: "Gasto Fijo",
        icon: Receipt,
        color: "bg-red-500/10 text-red-600 border-red-500/20",
        bgGradient: "from-red-500/5 to-red-600/5",
        description: "Gastos fijos mensuales",
      },
      gastoVariable: {
        label: "Gasto Variable",
        icon: TrendingUp,
        color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        bgGradient: "from-orange-500/5 to-orange-600/5",
        description: "Gastos variables ocasionales",
      },
      deuda: {
        label: "Deuda",
        icon: CreditCard,
        color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        bgGradient: "from-purple-500/5 to-purple-600/5",
        description: "Registro de deudas pendientes",
      },
      abono: {
        label: "Abono",
        icon: DollarSign,
        color: "bg-green-500/10 text-green-600 border-green-500/20",
        bgGradient: "from-green-500/5 to-green-600/5",
        description: "Pagos realizados a deudas",
      },
    }
    return typeInfo[type] || typeInfo.compra
  }

  const typeInfo = getTypeInfo(record.type)
  const Icon = typeInfo.icon

  const formatDate = (dateString) => {
    if (!dateString) return "No especificada"
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getMainValue = () => {
    return record.valor || record.monto_total || record.ingresos_dia || 0
  }

  const renderSpecificFields = () => {
    switch (record.type) {
      case "caja":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Resumen de Caja
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={`p-4 border bg-gradient-to-br ${typeInfo.bgGradient} ${typeInfo.color}`}>
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Ingresos del Día</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${record.ingresos_dia?.toLocaleString("es-ES") || "0"}
                  </p>
                </div>
              </Card>
              <Card className="p-4 border bg-gradient-to-br from-red-500/5 to-red-600/5">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Total Gastos</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${record.total_gastos_dia?.toLocaleString("es-ES") || "0"}
                  </p>
                </div>
              </Card>
              <Card className="p-4 border bg-gradient-to-br from-blue-500/5 to-blue-600/5">
                <div className="text-center">
                  <div
                    className={`w-12 h-12 ${record.saldo_dia >= 0 ? "bg-blue-500" : "bg-red-500"} rounded-full flex items-center justify-center mx-auto mb-2`}
                  >
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo del Día</p>
                  <p className={`text-2xl font-bold ${record.saldo_dia >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    ${record.saldo_dia?.toLocaleString("es-ES") || "0"}
                  </p>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <History className="w-5 h-5" />
                Detalles de Gastos del Día
              </h4>

              {loadingDayExpenses ? (
                <Card className="p-4 border">
                  <div className="text-center text-muted-foreground">Cargando gastos del día...</div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Gastos Fijos */}
                  {dayExpenses.gastosFijos.length > 0 && (
                    <div>
                      <h5 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Gastos Fijos ({dayExpenses.gastosFijos.length})
                      </h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {dayExpenses.gastosFijos.map((gasto) => (
                          <Card key={gasto._id} className="p-3 border bg-gradient-to-br from-red-500/5 to-red-600/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Receipt className="w-4 h-4 text-red-500" />
                                <span className="font-medium text-sm">{gasto.detalle || "Sin descripción"}</span>
                              </div>
                              <span className="font-bold text-red-600">${gasto.valor?.toLocaleString("es-ES")}</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gastos Variables */}
                  {dayExpenses.gastosVariables.length > 0 && (
                    <div>
                      <h5 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Gastos Variables ({dayExpenses.gastosVariables.length})
                      </h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {dayExpenses.gastosVariables.map((gasto) => (
                          <Card
                            key={gasto._id}
                            className="p-3 border bg-gradient-to-br from-orange-500/5 to-orange-600/5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-orange-500" />
                                <span className="font-medium text-sm">{gasto.detalle || "Sin descripción"}</span>
                              </div>
                              <span className="font-bold text-orange-600">${gasto.valor?.toLocaleString("es-ES")}</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compras */}
                  {dayExpenses.compras.length > 0 && (
                    <div>
                      <h5 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Compras ({dayExpenses.compras.length})
                      </h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {dayExpenses.compras.map((compra) => (
                          <Card key={compra._id} className="p-3 border bg-gradient-to-br from-blue-500/5 to-blue-600/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <ShoppingCart className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-sm">
                                  {compra.detalle || compra.destino || "Sin descripción"}
                                </span>
                              </div>
                              <span className="font-bold text-blue-600">${compra.valor?.toLocaleString("es-ES")}</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deudas */}
                  {dayExpenses.deudas.length > 0 && (
                    <div>
                      <h5 className="font-medium text-purple-600 mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Deudas Registradas ({dayExpenses.deudas.length})
                      </h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {dayExpenses.deudas.map((deuda) => (
                          <Card
                            key={deuda._id}
                            className="p-3 border bg-gradient-to-br from-purple-500/5 to-purple-600/5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <CreditCard className="w-4 h-4 text-purple-500" />
                                <span className="font-medium text-sm">
                                  {deuda.detalle || deuda.destino || "Sin descripción"}
                                </span>
                              </div>
                              <span className="font-bold text-purple-600">
                                ${deuda.monto_total?.toLocaleString("es-ES")}
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Abonos */}
                  {dayExpenses.abonos.length > 0 && (
                    <div>
                      <h5 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Abonos Realizados ({dayExpenses.abonos.length})
                      </h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {dayExpenses.abonos.map((abono) => (
                          <Card
                            key={abono._id}
                            className="p-3 border bg-gradient-to-br from-green-500/5 to-green-600/5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="font-medium text-sm">{abono.detalle || "Abono a deuda"}</span>
                              </div>
                              <span className="font-bold text-green-600">${abono.valor?.toLocaleString("es-ES")}</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje si no hay gastos */}
                  {Object.values(dayExpenses).every((arr) => arr.length === 0) && (
                    <Card className="p-4 border bg-muted/30 border-dashed">
                      <div className="text-center text-muted-foreground">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No se registraron gastos en este día</p>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case "deuda":
        const porcentajePagado =
          record.monto_total > 0 ? ((record.monto_total - record.saldo_actual) / record.monto_total) * 100 : 0
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Estado de la Deuda
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 border bg-gradient-to-br from-purple-500/5 to-purple-600/5">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Monto Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${record.monto_total?.toLocaleString("es-ES") || "0"}
                  </p>
                </div>
              </Card>
              <Card className="p-4 border bg-gradient-to-br from-red-500/5 to-red-600/5">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Pendiente</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${record.saldo_actual?.toLocaleString("es-ES") || "0"}
                  </p>
                </div>
              </Card>
            </div>
            <Card className="p-6 border bg-gradient-to-br from-green-500/5 to-green-600/5">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-white">{porcentajePagado.toFixed(0)}%</span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Progreso de Pago</p>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${porcentajePagado}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Pagado: ${(record.monto_total - record.saldo_actual || 0).toLocaleString("es-ES")}
                </p>
              </div>
            </Card>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de Abonos ({relatedAbonos.length})
              </h4>

              {loadingAbonos ? (
                <Card className="p-4 border">
                  <div className="text-center text-muted-foreground">Cargando abonos relacionados...</div>
                </Card>
              ) : relatedAbonos.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {relatedAbonos.map((abono, index) => (
                    <Card
                      key={abono._id}
                      className="p-4 border bg-gradient-to-br from-green-500/5 to-green-600/5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-600">
                              ${abono.valor?.toLocaleString("es-ES") || "0"}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(abono.fecha)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-xs">
                            Abono #{index + 1}
                          </Badge>
                          {abono.detalle && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-32 truncate">{abono.detalle}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-4 border bg-muted/30 border-dashed">
                  <div className="text-center text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay abonos registrados para esta deuda</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )

      case "compra":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Detalles de la Compra
            </h4>
            <Card className={`p-6 border bg-gradient-to-br ${typeInfo.bgGradient}`}>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Valor de la Compra</p>
                <p className="text-3xl font-bold text-blue-600">${record.valor?.toLocaleString("es-ES") || "0"}</p>
              </div>
            </Card>
          </div>
        )

      case "gastoFijo":
      case "gastoVariable":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Icon className="w-5 h-5" />
              Información del Gasto
            </h4>
            <Card className={`p-6 border bg-gradient-to-br ${typeInfo.bgGradient}`}>
              <div className="text-center">
                <div
                  className={`w-16 h-16 ${record.type === "gastoFijo" ? "bg-red-500" : "bg-orange-500"} rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Monto del Gasto</p>
                <p className={`text-3xl font-bold ${record.type === "gastoFijo" ? "text-red-600" : "text-orange-600"}`}>
                  ${record.valor?.toLocaleString("es-ES") || "0"}
                </p>
              </div>
            </Card>
          </div>
        )

      case "abono":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Información del Abono
            </h4>
            <Card className={`p-6 border bg-gradient-to-br ${typeInfo.bgGradient}`}>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Monto del Abono</p>
                <p className="text-3xl font-bold text-green-600">${record.valor?.toLocaleString("es-ES") || "0"}</p>
              </div>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${typeInfo.color} border-2 mx-auto sm:mx-0`}
              >
                <Icon className="w-8 h-8" />
              </div>
              <div className="text-center sm:text-left">
                <DialogTitle className="text-xl sm:text-2xl font-bold">{typeInfo.label}</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">{typeInfo.description}</DialogDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs mx-auto sm:mx-0">
              ID: {record._id?.slice(-8) || "N/A"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 sm:space-y-8">
          <Card className={`border-2 bg-gradient-to-br ${typeInfo.bgGradient} ${typeInfo.color}`}>
            <CardContent className="p-4 sm:p-8">
              <div className="text-center space-y-4">
                <h3 className="text-lg sm:text-2xl font-bold text-foreground break-words">
                  {record.detalle || record.destino || record.descripcion || "Sin descripción"}
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  <DollarSign className="w-6 sm:w-8 h-6 sm:h-8 text-primary flex-shrink-0" />
                  <p className="text-2xl sm:text-4xl font-bold text-primary break-all">
                    {getMainValue().toLocaleString("es-ES")}
                  </p>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {formatDate(record.fecha || record.fecha_inicio)}
                </p>
              </div>
            </CardContent>
          </Card>

          {renderSpecificFields()}

          <div className="space-y-4">
            <h4 className="font-semibold text-base sm:text-lg flex items-center gap-2">
              <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
              Información General
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                    <p className="font-semibold text-sm sm:text-base break-words">
                      {formatDate(record.fecha || record.fecha_inicio)}
                    </p>
                  </div>
                </div>
              </Card>

              {record.destino && (
                <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Destino</p>
                      <p className="font-semibold text-sm sm:text-base break-words">{record.destino}</p>
                    </div>
                  </div>
                </Card>
              )}

              {record.deuda_id && (
                <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-purple-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Deuda Relacionada</p>
                      <p className="font-semibold text-sm sm:text-base break-words">
                        {typeof record.deuda_id === "object"
                          ? record.deuda_id.detalle || record.deuda_id.destino
                          : record.deuda_id}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}
                  >
                    <Icon className="w-4 sm:w-5 h-4 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Tipo de Registro</p>
                    <p className="font-semibold text-sm sm:text-base">{typeInfo.label}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card className="p-3 sm:p-4 bg-muted/30 border-dashed">
            <h4 className="font-semibold mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Detalles y Observaciones</span>
            </h4>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-foreground leading-relaxed">
                {record.detalle || record.observaciones || record.descripcion || "Sin observaciones adicionales"}
              </p>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-muted/20 border-muted">
            <h4 className="font-semibold mb-3 text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <Database className="w-3 sm:w-4 h-3 sm:h-4" />
              Información del Sistema
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-background/50 rounded space-y-1 sm:space-y-0">
                <span className="font-medium text-muted-foreground">Creado:</span>
                <span className="text-foreground break-words">
                  {record.createdAt ? new Date(record.createdAt).toLocaleString("es-ES") : "No disponible"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-background/50 rounded space-y-1 sm:space-y-0">
                <span className="font-medium text-muted-foreground">Actualizado:</span>
                <span className="text-foreground break-words">
                  {record.updatedAt ? new Date(record.updatedAt).toLocaleString("es-ES") : "No disponible"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
