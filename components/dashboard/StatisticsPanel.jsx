"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiService } from "@/services/apiService"
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  Activity,
  Zap,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
  Clock,
  Calculator,
  ScanText as Scatter,
  LineChart,
  Brain,
  Gauge,
  Users,
  Timer,
  Layers,
  Award,
  Flame,
  Sparkles,
} from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function StatisticsPanel() {
  const [stats, setStats] = useState({
    monthlyTrends: [],
    categoryBreakdown: [],
    weeklyAverage: 0,
    topExpenseCategories: [],
    savingsRate: 0,
    expenseGrowth: 0,
    scatterData: [],
    correlationMatrix: [],
    seasonalAnalysis: {},
    cashFlowVelocity: 0,
    financialHealth: {
      score: 0,
      factors: [],
      recommendations: [],
    },
    behaviorPatterns: {
      spendingPersonality: "",
      riskProfile: "",
      optimizationOpportunities: [],
    },
    advancedMetrics: {
      sharpeRatio: 0,
      maxDrawdown: 0,
      recoveryTime: 0,
      consistencyIndex: 0,
      diversificationScore: 0,
    },
    kpis: {
      burnRate: 0,
      runwayMonths: 0,
      avgTransactionSize: 0,
      transactionFrequency: 0,
      volatilityIndex: 0,
      efficiencyRatio: 0,
    },
    predictions: {
      nextMonthExpenses: 0,
      yearEndBalance: 0,
      savingsGoalProgress: 0,
      riskAdjustedReturn: 0,
      optimalBudgetAllocation: {},
    },
    comparisons: {
      vsLastMonth: { ingresos: 0, gastos: 0, balance: 0 },
      vsLastYear: { ingresos: 0, gastos: 0, balance: 0 },
      quarterlyGrowth: 0,
      industryBenchmark: 0,
    },
    timeAnalysis: {
      bestPerformingMonth: null,
      worstPerformingMonth: null,
      seasonalTrends: [],
      weekdayPatterns: [],
      hourlyPatterns: [],
      cyclicalPatterns: [],
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dateRange, setDateRange] = useState("6months")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState("overview") // Added metric selector

  useEffect(() => {
    loadStatistics()
  }, [dateRange])

  const loadStatistics = async () => {
    try {
      setRefreshing(true)
      const cajaData = await apiService.caja.get()
      const ingresos = await apiService.caja.listIngresos()
      const [compras, gastosFijos, gastosVariables, deudas, abonos] = await Promise.all([
        apiService.compras.getAll(),
        apiService.gastosFijos.getAll(),
        apiService.gastosVariables.getAll(),
        apiService.deudas.getAll(),
        apiService.abonos.getAll(),
      ])

      const totalIngresos = (ingresos || []).reduce((sum, item) => sum + (item.valor || 0), 0)
      const totalGastosFijos = gastosFijos.reduce((sum, gasto) => sum + (gasto.valor || 0), 0)
      const totalGastosVariables = gastosVariables.reduce((sum, gasto) => sum + (gasto.valor || 0), 0)
      const totalCompras = compras.reduce((sum, compra) => sum + (compra.valor || 0), 0)
      const totalGastos = totalGastosFijos + totalGastosVariables + totalCompras

      const allTransactions = [
        ...(ingresos || []).map((item) => ({
          ...item,
          type: "ingreso",
          amount: item.valor,
          category: item.origen || "Ingresos",
          timestamp: new Date(item.fecha),
        })),
        ...compras.map((item) => ({
          ...item,
          type: "compra",
          amount: -item.valor,
          category: item.destino || "Compras",
          timestamp: new Date(item.fecha),
        })),
        ...gastosFijos.map((item) => ({
          ...item,
          type: "gastoFijo",
          amount: -item.valor,
          category: "Gastos Fijos",
          timestamp: new Date(item.fecha),
        })),
        ...gastosVariables.map((item) => ({
          ...item,
          type: "gastoVariable",
          amount: -item.amount,
          category: "Gastos Variables",
          timestamp: new Date(item.fecha),
        })),
      ]
        .filter((t) => {
          const transactionDate = new Date(t.fecha)
          const now = new Date()
          const monthsBack = dateRange === "3months" ? 3 : dateRange === "6months" ? 6 : 12
          const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
          return transactionDate >= cutoffDate
        })
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

      const scatterData = allTransactions.map((t, index) => ({
        x: index,
        y: Math.abs(t.amount),
        size: Math.log(Math.abs(t.amount) + 1) * 5,
        color: t.amount > 0 ? "#10b981" : "#ef4444",
        category: t.category,
        date: t.timestamp,
        type: t.type,
      }))

      const categories = [...new Set(allTransactions.map((t) => t.category))]
      const correlationMatrix = categories.map((cat1) => ({
        category: cat1,
        correlations: categories.map((cat2) => {
          const cat1Data = allTransactions.filter((t) => t.category === cat1).map((t) => Math.abs(t.amount))
          const cat2Data = allTransactions.filter((t) => t.category === cat2).map((t) => Math.abs(t.amount))

          if (cat1Data.length === 0 || cat2Data.length === 0) return 0

          const correlation = calculateCorrelation(cat1Data, cat2Data)
          return { category: cat2, value: correlation }
        }),
      }))

      const monthlyData = {}
      const currentDate = new Date()

      allTransactions.forEach((transaction) => {
        const date = new Date(transaction.fecha)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            ingresos: 0,
            gastos: 0,
            balance: 0,
            transactions: 0,
            date: new Date(date.getFullYear(), date.getMonth(), 1),
            categories: {},
            volatility: 0,
            maxSingleTransaction: 0,
            avgTransactionSize: 0,
          }
        }

        monthlyData[monthKey].transactions++
        monthlyData[monthKey].maxSingleTransaction = Math.max(
          monthlyData[monthKey].maxSingleTransaction,
          Math.abs(transaction.amount),
        )

        if (!monthlyData[monthKey].categories[transaction.category]) {
          monthlyData[monthKey].categories[transaction.category] = 0
        }
        monthlyData[monthKey].categories[transaction.category] += Math.abs(transaction.amount)

        if (transaction.amount > 0) {
          monthlyData[monthKey].ingresos += transaction.amount
        } else {
          monthlyData[monthKey].gastos += Math.abs(transaction.amount)
        }
        monthlyData[monthKey].balance = monthlyData[monthKey].ingresos - monthlyData[monthKey].gastos
        monthlyData[monthKey].avgTransactionSize =
          (monthlyData[monthKey].ingresos + monthlyData[monthKey].gastos) / monthlyData[monthKey].transactions
      })

      Object.keys(monthlyData).forEach((monthKey) => {
        const monthTransactions = allTransactions.filter((t) => {
          const date = new Date(t.fecha)
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          return key === monthKey
        })

        if (monthTransactions.length > 1) {
          const amounts = monthTransactions.map((t) => Math.abs(t.amount))
          const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length
          const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length
          monthlyData[monthKey].volatility = Math.sqrt(variance)
        }
      })

      const monthlyTrends = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month: new Date(month + "-01").toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
          monthKey: month,
          ...data,
        }))

      const avgMonthlyExpenses =
        monthlyTrends.length > 0 ? monthlyTrends.reduce((sum, m) => sum + m.gastos, 0) / monthlyTrends.length : 0

      const burnRate = avgMonthlyExpenses
      const runwayMonths = totalIngresos > 0 ? totalIngresos / (burnRate || 1) : 0

      const avgTransactionSize =
        allTransactions.length > 0
          ? Math.abs(allTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / allTransactions.length)
          : 0

      const transactionFrequency = allTransactions.length / (monthlyTrends.length || 1)

      const monthlyReturns = monthlyTrends.map((m) => m.balance)
      const avgReturn = monthlyReturns.reduce((sum, ret) => sum + ret, 0) / (monthlyReturns.length || 1)
      const volatilityIndex =
        monthlyReturns.length > 1
          ? Math.sqrt(
              monthlyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / monthlyReturns.length,
            )
          : 0

      const sharpeRatio = volatilityIndex > 0 ? avgReturn / volatilityIndex : 0
      const maxDrawdown = calculateMaxDrawdown(monthlyReturns)
      const recoveryTime = calculateRecoveryTime(monthlyReturns)

      const efficiencyRatio = totalIngresos > 0 ? (totalIngresos - totalGastos) / totalIngresos : 0

      const cashFlowVelocity =
        allTransactions.length > 0
          ? allTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / allTransactions.length
          : 0

      const healthFactors = [
        { name: "Ratio de Ahorro", score: Math.min(efficiencyRatio * 100, 100), weight: 0.3 },
        { name: "Estabilidad de Ingresos", score: Math.max(100 - volatilityIndex / 1000, 0), weight: 0.25 },
        { name: "Diversificación", score: Math.min(categories.length * 10, 100), weight: 0.2 },
        { name: "Liquidez", score: Math.min(runwayMonths * 10, 100), weight: 0.25 },
      ]

      const financialHealthScore = healthFactors.reduce((sum, factor) => sum + factor.score * factor.weight, 0)

      const spendingPersonality = determineSpendingPersonality(allTransactions, monthlyTrends)
      const riskProfile = determineRiskProfile(volatilityIndex, efficiencyRatio)

      const seasonalAnalysis = calculateSeasonalTrends(allTransactions)

      const hourlyPatterns = Array(24)
        .fill(0)
        .map((_, hour) => {
          const hourTransactions = allTransactions.filter((t) => new Date(t.fecha).getHours() === hour)
          return {
            hour,
            transactions: hourTransactions.length,
            totalAmount: hourTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
            avgAmount:
              hourTransactions.length > 0
                ? hourTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / hourTransactions.length
                : 0,
          }
        })

      const recentTrend = monthlyTrends.slice(-3)
      const nextMonthExpenses =
        recentTrend.length > 0
          ? recentTrend.reduce((sum, m) => sum + m.gastos, 0) / recentTrend.length
          : avgMonthlyExpenses

      const monthlyNetIncome = totalIngresos / (monthlyTrends.length || 1) - nextMonthExpenses
      const yearEndBalance = totalIngresos + monthlyNetIncome * (12 - new Date().getMonth())

      const lastMonth = monthlyTrends[monthlyTrends.length - 1]
      const previousMonth = monthlyTrends[monthlyTrends.length - 2]
      const lastYearMonth = monthlyTrends.find((m) => {
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthDate = new Date(m.monthKey + "-01")
        return monthDate.getMonth() === currentMonth && monthDate.getFullYear() === currentYear - 1
      })

      const vsLastMonth = previousMonth
        ? {
            ingresos: (((lastMonth?.ingresos || 0) - previousMonth.ingresos) / (previousMonth.ingresos || 1)) * 100,
            gastos: (((lastMonth?.gastos || 0) - previousMonth.gastos) / (previousMonth.gastos || 1)) * 100,
            balance: (((lastMonth?.balance || 0) - previousMonth.balance) / Math.abs(previousMonth.balance || 1)) * 100,
          }
        : { ingresos: 0, gastos: 0, balance: 0 }

      const vsLastYear = lastYearMonth
        ? {
            ingresos: (((lastMonth?.ingresos || 0) - lastYearMonth.ingresos) / (lastYearMonth.ingresos || 1)) * 100,
            gastos: (((lastMonth?.gastos || 0) - lastYearMonth.gastos) / (lastYearMonth.gastos || 1)) * 100,
            balance: (((lastMonth?.balance || 0) - lastYearMonth.balance) / Math.abs(lastYearMonth.balance || 1)) * 100,
          }
        : { ingresos: 0, gastos: 0, balance: 0 }

      const bestMonth = monthlyTrends.reduce(
        (best, current) => (current.balance > (best?.balance || Number.NEGATIVE_INFINITY) ? current : best),
        null,
      )
      const worstMonth = monthlyTrends.reduce(
        (worst, current) => (current.balance < (worst?.balance || Number.POSITIVE_INFINITY) ? current : worst),
        null,
      )

      const weekdayData = Array(7)
        .fill(0)
        .map(() => ({
          transactions: 0,
          amount: 0,
          categories: {},
          avgHour: 0,
          peakHour: 0,
        }))

      allTransactions.forEach((t) => {
        const dayOfWeek = new Date(t.fecha).getDay()
        const hour = new Date(t.fecha).getHours()

        weekdayData[dayOfWeek].transactions++
        weekdayData[dayOfWeek].amount += Math.abs(t.amount)
        weekdayData[dayOfWeek].avgHour += hour

        if (!weekdayData[dayOfWeek].categories[t.category]) {
          weekdayData[dayOfWeek].categories[t.category] = 0
        }
        weekdayData[dayOfWeek].categories[t.category]++
      })

      const weekdayPatterns = weekdayData.map((data, index) => ({
        day: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][index],
        ...data,
        avgAmount: data.transactions > 0 ? data.amount / data.transactions : 0,
        avgHour: data.transactions > 0 ? data.avgHour / data.transactions : 0,
        topCategory: Object.keys(data.categories).reduce(
          (a, b) => (data.categories[a] > data.categories[b] ? a : b),
          "N/A",
        ),
      }))

      const categoryBreakdown = [
        {
          name: "Compras",
          value: totalCompras,
          percentage: totalGastos > 0 ? (totalCompras / totalGastos) * 100 : 0,
          color: "hsl(var(--accent))",
          trend: calculateCategoryTrend(compras, "compra"),
          avgTransaction: compras.length > 0 ? totalCompras / compras.length : 0,
          frequency: compras.length,
        },
        {
          name: "Gastos Fijos",
          value: totalGastosFijos,
          percentage: totalGastos > 0 ? (totalGastosFijos / totalGastos) * 100 : 0,
          color: "hsl(var(--destructive))",
          trend: calculateCategoryTrend(gastosFijos, "gastoFijo"),
          avgTransaction: gastosFijos.length > 0 ? totalGastosFijos / gastosFijos.length : 0,
          frequency: gastosFijos.length,
        },
        {
          name: "Gastos Variables",
          value: totalGastosVariables,
          percentage: totalGastos > 0 ? (totalGastosVariables / totalGastos) * 100 : 0,
          color: "hsl(var(--secondary))",
          trend: calculateCategoryTrend(gastosVariables, "gastoVariable"),
          avgTransaction: gastosVariables.length > 0 ? totalGastosVariables / gastosVariables.length : 0,
          frequency: gastosVariables.length,
        },
      ].filter((item) => item.value > 0)

      const expensesByCategory = {}
      compras.forEach((compra) => {
        const category = compra.destino || "Sin categoría"
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = {
            amount: 0,
            count: 0,
            lastTransaction: null,
            trend: 0,
          }
        }
        expensesByCategory[category].amount += compra.valor
        expensesByCategory[category].count++
        expensesByCategory[category].lastTransaction = new Date(compra.fecha)
      })

      const topExpenseCategories = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b.amount - a.amount)
        .slice(0, 8)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
          avgAmount: data.amount / data.count,
          lastTransaction: data.lastTransaction,
          percentage: (data.amount / totalCompras) * 100,
        }))

      const weeklyAverage = avgMonthlyExpenses / 4.3
      const savingsRate = totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos) * 100 : 0
      const expenseGrowth = vsLastMonth.gastos

      setStats({
        monthlyTrends,
        categoryBreakdown,
        weeklyAverage,
        topExpenseCategories,
        savingsRate,
        expenseGrowth,
        scatterData,
        correlationMatrix,
        seasonalAnalysis,
        cashFlowVelocity,
        financialHealth: {
          score: financialHealthScore,
          factors: healthFactors,
          recommendations: generateRecommendations(healthFactors, efficiencyRatio, volatilityIndex),
        },
        behaviorPatterns: {
          spendingPersonality,
          riskProfile,
          optimizationOpportunities: generateOptimizationOpportunities(categoryBreakdown, monthlyTrends),
        },
        advancedMetrics: {
          sharpeRatio,
          maxDrawdown,
          recoveryTime,
          consistencyIndex: calculateConsistencyIndex(monthlyTrends),
          diversificationScore: categories.length * 10,
        },
        kpis: {
          burnRate,
          runwayMonths,
          avgTransactionSize,
          transactionFrequency,
          volatilityIndex: volatilityIndex / 1000,
          efficiencyRatio: efficiencyRatio * 100,
        },
        predictions: {
          nextMonthExpenses,
          yearEndBalance,
          savingsGoalProgress: Math.min(((totalIngresos - totalGastos) / (totalIngresos * 0.2)) * 100, 100),
          riskAdjustedReturn: sharpeRatio * 100,
          optimalBudgetAllocation: calculateOptimalAllocation(categoryBreakdown),
        },
        comparisons: {
          vsLastMonth,
          vsLastYear,
          quarterlyGrowth: monthlyTrends.slice(-3).reduce((sum, m) => sum + m.balance, 0) / 3,
          industryBenchmark: calculateIndustryBenchmark(savingsRate),
        },
        timeAnalysis: {
          bestPerformingMonth: bestMonth,
          worstPerformingMonth: worstMonth,
          seasonalTrends: monthlyTrends.slice(-12),
          weekdayPatterns,
          hourlyPatterns,
          cyclicalPatterns: calculateCyclicalPatterns(monthlyTrends),
        },
      })
    } catch (error) {
      console.error("[v0] Statistics error:", error)
      setError("Error al cargar las estadísticas: " + error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const calculateCorrelation = (x, y) => {
    const n = Math.min(x.length, y.length)
    if (n === 0) return 0

    const sumX = x.slice(0, n).reduce((sum, val) => sum + val, 0)
    const sumY = y.slice(0, n).reduce((sum, val) => sum + val, 0)
    const sumXY = x.slice(0, n).reduce((sum, val, i) => sum + val * y[i], 0)
    const sumX2 = x.slice(0, n).reduce((sum, val) => sum + val * val, 0)
    const sumY2 = y.slice(0, n).reduce((sum, val) => sum + val * val, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  const calculateMaxDrawdown = (returns) => {
    let maxDrawdown = 0
    let peak = returns[0] || 0

    returns.forEach((value) => {
      if (value > peak) peak = value
      const drawdown = (peak - value) / peak
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    })

    return maxDrawdown * 100
  }

  const calculateRecoveryTime = (returns) => {
    let inDrawdown = false
    let drawdownStart = 0
    let maxRecoveryTime = 0
    let peak = returns[0] || 0

    returns.forEach((value, index) => {
      if (value > peak) {
        peak = value
        if (inDrawdown) {
          maxRecoveryTime = Math.max(maxRecoveryTime, index - drawdownStart)
          inDrawdown = false
        }
      } else if (value < peak && !inDrawdown) {
        inDrawdown = true
        drawdownStart = index
      }
    })

    return maxRecoveryTime
  }

  const determineSpendingPersonality = (transactions, trends) => {
    const avgTransaction = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length
    const largeTransactions = transactions.filter((t) => Math.abs(t.amount) > avgTransaction * 2).length
    const regularityScore = calculateRegularityScore(trends)

    if (largeTransactions > transactions.length * 0.3) return "Gastador Impulsivo"
    if (regularityScore > 0.8) return "Planificador Metódico"
    if (avgTransaction < 50000) return "Gastador Conservador"
    return "Gastador Equilibrado"
  }

  const determineRiskProfile = (volatility, efficiency) => {
    if (volatility > 100 && efficiency < 0) return "Alto Riesgo"
    if (volatility < 50 && efficiency > 0.2) return "Conservador"
    return "Moderado"
  }

  const calculateSeasonalTrends = (transactions) => {
    const seasons = { spring: 0, summer: 0, fall: 0, winter: 0 }

    transactions.forEach((t) => {
      const month = new Date(t.fecha).getMonth()
      if (month >= 2 && month <= 4) seasons.spring += Math.abs(t.amount)
      else if (month >= 5 && month <= 7) seasons.summer += Math.abs(t.amount)
      else if (month >= 8 && month <= 10) seasons.fall += Math.abs(t.amount)
      else seasons.winter += Math.abs(t.amount)
    })

    return seasons
  }

  const calculateCategoryTrend = (categoryData, type) => {
    if (categoryData.length < 2) return 0

    const recent = categoryData.slice(-Math.ceil(categoryData.length / 2))
    const older = categoryData.slice(0, Math.floor(categoryData.length / 2))

    const recentAvg = recent.reduce((sum, item) => sum + (item.valor || item.amount || 0), 0) / recent.length
    const olderAvg = older.reduce((sum, item) => sum + (item.valor || item.amount || 0), 0) / older.length

    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0
  }

  const calculateRegularityScore = (trends) => {
    if (trends.length < 3) return 0

    const balances = trends.map((t) => t.balance)
    const mean = balances.reduce((sum, val) => sum + val, 0) / balances.length
    const variance = balances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / balances.length
    const stdDev = Math.sqrt(variance)

    return Math.max(0, 1 - stdDev / Math.abs(mean))
  }

  const calculateConsistencyIndex = (trends) => {
    if (trends.length < 2) return 0

    const changes = trends.slice(1).map((trend, i) => Math.abs(trend.balance - trends[i].balance))

    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
    const maxPossibleChange = Math.max(...trends.map((t) => Math.abs(t.balance)))

    return maxPossibleChange > 0 ? Math.max(0, 100 - (avgChange / maxPossibleChange) * 100) : 0
  }

  const calculateOptimalAllocation = (categories) => {
    const total = categories.reduce((sum, cat) => sum + cat.value, 0)
    return categories.reduce((allocation, cat) => {
      allocation[cat.name] = {
        current: (cat.value / total) * 100,
        optimal: cat.name === "Gastos Fijos" ? 50 : cat.name === "Compras" ? 30 : 20,
        difference: (cat.value / total) * 100 - (cat.name === "Gastos Fijos" ? 50 : cat.name === "Compras" ? 30 : 20),
      }
      return allocation
    }, {})
  }

  const calculateIndustryBenchmark = (savingsRate) => {
    const benchmarkSavingsRate = 20 // Industry standard 20%
    return ((savingsRate - benchmarkSavingsRate) / benchmarkSavingsRate) * 100
  }

  const calculateCyclicalPatterns = (trends) => {
    return trends.map((trend, index) => ({
      ...trend,
      cyclicalPosition: (index % 12) / 12,
      seasonalAdjustment: Math.sin(((index % 12) * Math.PI) / 6) * 0.1,
    }))
  }

  const generateRecommendations = (factors, efficiency, volatility) => {
    const recommendations = []

    if (efficiency < 0.1) recommendations.push("Considera reducir gastos variables para mejorar tu ratio de ahorro")
    if (volatility > 100) recommendations.push("Busca estabilizar tus ingresos para reducir la volatilidad financiera")
    if (factors.find((f) => f.name === "Liquidez")?.score < 50) {
      recommendations.push("Aumenta tu fondo de emergencia para mejorar la liquidez")
    }

    return recommendations
  }

  const generateOptimizationOpportunities = (categories, trends) => {
    const opportunities = []

    const highestCategory = categories.reduce(
      (max, cat) => (cat.percentage > max.percentage ? cat : max),
      categories[0] || { percentage: 0 },
    )

    if (highestCategory.percentage > 50) {
      opportunities.push(
        `Considera diversificar gastos - ${highestCategory.name} representa ${highestCategory.percentage.toFixed(1)}% del total`,
      )
    }

    const recentTrend = trends.slice(-3)
    const increasingExpenses = recentTrend.every((trend, i) => i === 0 || trend.gastos > recentTrend[i - 1].gastos)

    if (increasingExpenses) {
      opportunities.push("Tus gastos han aumentado consistentemente - revisa presupuesto")
    }

    return opportunities
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatPercentage = (value) => {
    const sign = value > 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            🧠 Centro de Inteligencia Financiera
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Análisis avanzado con IA, predicciones y ciencia de datos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-background text-sm"
          >
            <option value="overview">Vista General</option>
            <option value="advanced">Métricas Avanzadas</option>
            <option value="behavioral">Análisis Conductual</option>
            <option value="predictive">Modelos Predictivos</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-background text-sm"
          >
            <option value="3months">Últimos 3 meses</option>
            <option value="6months">Últimos 6 meses</option>
            <option value="12months">Último año</option>
          </select>
          <Button onClick={loadStatistics} disabled={refreshing} size="sm" className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Gauge className="w-6 h-6 text-blue-600" />
            <span>Puntuación de Salud Financiera</span>
            <div className="ml-auto text-3xl font-bold text-blue-600">{stats.financialHealth.score.toFixed(0)}/100</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.financialHealth.factors.map((factor, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{factor.name}</span>
                  <span className="text-sm text-blue-600 font-bold">{factor.score.toFixed(0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                    style={{ width: `${Math.min(factor.score, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {stats.financialHealth.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Recomendaciones IA
              </h4>
              {stats.financialHealth.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 p-2  rounded-lg">
                  <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Burn Rate</CardTitle>
            <Flame className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-red-600 break-all">
              {formatCurrency(stats.kpis.burnRate)}
            </div>
            <p className="text-xs text-muted-foreground">Gasto mensual promedio</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Runway</CardTitle>
            <Timer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-blue-600">{stats.kpis.runwayMonths.toFixed(1)} meses</div>
            <p className="text-xs text-muted-foreground">Duración con ingresos actuales</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Transacción Promedio</CardTitle>
            <Calculator className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-green-600 break-all">
              {formatCurrency(stats.kpis.avgTransactionSize)}
            </div>
            <p className="text-xs text-muted-foreground">Valor medio por operación</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Frecuencia</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-purple-600">
              {stats.kpis.transactionFrequency.toFixed(1)}/mes
            </div>
            <p className="text-xs text-muted-foreground">Transacciones mensuales</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Volatilidad</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-orange-600">{stats.kpis.volatilityIndex.toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">Variabilidad financiera</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Eficiencia</CardTitle>
            <Target className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-lg sm:text-xl font-bold ${stats.kpis.efficiencyRatio >= 0 ? "text-teal-600" : "text-red-600"}`}
            >
              {formatPercentage(stats.kpis.efficiencyRatio)}
            </div>
            <p className="text-xs text-muted-foreground">Ratio de optimización</p>
          </CardContent>
        </Card>
      </div>

      {selectedMetric === "advanced" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="w-5 h-5 text-indigo-600" />
                <span>Métricas Avanzadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3  rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {stats.advancedMetrics.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Ratio Sharpe</div>
                </div>
                <div className="text-center p-3  rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.advancedMetrics.maxDrawdown.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Max Drawdown</div>
                </div>
                <div className="text-center p-3  rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.advancedMetrics.consistencyIndex.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Índice Consistencia</div>
                </div>
                <div className="text-center p-3  rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.advancedMetrics.diversificationScore}</div>
                  <div className="text-xs text-muted-foreground">Score Diversificación</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scatter className="w-5 h-5 text-pink-600" />
                <span>Análisis de Dispersión</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-64  rounded-lg p-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-10 grid-rows-8 gap-1 w-full h-full">
                    {stats.scatterData.slice(0, 80).map((point, index) => (
                      <div
                        key={index}
                        className="rounded-full transition-all duration-300 hover:scale-150"
                        style={{
                          backgroundColor: point.color,
                          width: `${Math.min(point.size, 12)}px`,
                          height: `${Math.min(point.size, 12)}px`,
                          opacity: 0.7,
                        }}
                        title={`${point.category}: ${formatCurrency(point.y)}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                <span>🟢 Ingresos</span>
                <span>🔴 Gastos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-yellow-600" />
                <span>Matriz de Correlación</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.correlationMatrix.slice(0, 4).map((row, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-20 text-xs font-medium truncate">{row.category}</div>
                    <div className="flex-1 flex space-x-1">
                      {row.correlations.slice(0, 4).map((corr, j) => (
                        <div
                          key={j}
                          className="flex-1 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                          style={{
                            backgroundColor: `hsl(${corr.value > 0 ? "120" : "0"}, 70%, ${50 + Math.abs(corr.value) * 30}%)`,
                          }}
                        >
                          {corr.value.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedMetric === "behavioral" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Perfil Conductual</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4  rounded-lg">
                <div className="text-2xl font-bold text-emerald-600 mb-2">
                  {stats.behaviorPatterns.spendingPersonality}
                </div>
                <div className="text-sm text-muted-foreground">Personalidad de Gasto</div>
              </div>

              <div className="text-center p-4  rounded-lg">
                <div className="text-2xl font-bold text-teal-600 mb-2">{stats.behaviorPatterns.riskProfile}</div>
                <div className="text-sm text-muted-foreground">Perfil de Riesgo</div>
              </div>

              {stats.behaviorPatterns.optimizationOpportunities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Oportunidades de Optimización</h4>
                  {stats.behaviorPatterns.optimizationOpportunities.map((opp, index) => (
                    <div key={index} className="flex items-start gap-2 p-2  rounded-lg">
                      <Award className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{opp}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-violet-600" />
                <span>Patrones Horarios</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2">
                {stats.timeAnalysis.hourlyPatterns
                  .filter((_, i) => i % 4 === 0)
                  .map((hour, index) => (
                    <div key={index} className="text-center p-2  rounded-lg">
                      <div className="text-sm font-bold text-violet-600">{hour.hour}:00</div>
                      <div className="text-xs text-muted-foreground">{hour.transactions}</div>
                      <div className="text-xs font-medium break-all">{formatCurrency(hour.avgAmount)}</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedMetric === "predictive" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-cyan-600" />
                <span>Predicciones IA Avanzadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3  rounded-lg">
                  <div className="text-lg font-bold text-cyan-600 break-all">
                    {formatCurrency(stats.predictions.nextMonthExpenses)}
                  </div>
                  <div className="text-xs text-muted-foreground">Gastos Próximo Mes</div>
                </div>
                <div className="text-center p-3  rounded-lg">
                  <div className="text-lg font-bold text-blue-600 break-all">
                    {formatCurrency(stats.predictions.yearEndBalance)}
                  </div>
                  <div className="text-xs text-muted-foreground">Balance Fin de Año</div>
                </div>
                <div className="text-center p-3  rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {stats.predictions.riskAdjustedReturn.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Retorno Ajustado</div>
                </div>
                <div className="text-center p-3  rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {stats.predictions.savingsGoalProgress.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Meta Ahorro</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-rose-600" />
                <span>Asignación Óptima de Presupuesto</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.predictions.optimalBudgetAllocation).map(([category, allocation]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{category}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold">Actual: {allocation.current.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Óptimo: {allocation.optimal}%</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${Math.min(allocation.current, 100)}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-500 transition-all duration-500"
                          style={{ width: `${allocation.optimal}%` }}
                        />
                      </div>
                    </div>
                    <div className={`text-xs ${allocation.difference > 0 ? "text-red-600" : "text-green-600"}`}>
                      {allocation.difference > 0 ? "+" : ""}
                      {allocation.difference.toFixed(1)}% vs óptimo
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedMetric === "overview" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Predicciones IA</span>
                </CardTitle>
                <CardDescription>Proyecciones basadas en tendencias históricas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg">
                  <div>
                    <p className="font-medium">Gastos Próximo Mes</p>
                    <p className="text-sm text-muted-foreground">Predicción basada en tendencia</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600 break-all">
                      {formatCurrency(stats.predictions.nextMonthExpenses)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3  rounded-lg">
                  <div>
                    <p className="font-medium">Balance Fin de Año</p>
                    <p className="text-sm text-muted-foreground">Proyección anual</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold break-all ${stats.predictions.yearEndBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(stats.predictions.yearEndBalance)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3  rounded-lg">
                  <div>
                    <p className="font-medium">Meta de Ahorro</p>
                    <p className="text-sm text-muted-foreground">Progreso hacia 20% de ingresos</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{stats.predictions.savingsGoalProgress.toFixed(1)}%</div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${Math.min(stats.predictions.savingsGoalProgress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowUpDown className="w-5 h-5" />
                  <span>Análisis Comparativo</span>
                </CardTitle>
                <CardDescription>Comparaciones temporales y tendencias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">vs Mes Anterior</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2  rounded">
                      <div
                        className={`font-bold ${stats.comparisons.vsLastMonth.ingresos >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatPercentage(stats.comparisons.vsLastMonth.ingresos)}
                      </div>
                      <div className="text-xs text-muted-foreground">Ingresos</div>
                    </div>
                    <div className="text-center p-2  rounded">
                      <div
                        className={`font-bold ${stats.comparisons.vsLastMonth.gastos <= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatPercentage(stats.comparisons.vsLastMonth.gastos)}
                      </div>
                      <div className="text-xs text-muted-foreground">Gastos</div>
                    </div>
                    <div className="text-center p-2  rounded">
                      <div
                        className={`font-bold ${stats.comparisons.vsLastMonth.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatPercentage(stats.comparisons.vsLastMonth.balance)}
                      </div>
                      <div className="text-xs text-muted-foreground">Balance</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">vs Año Anterior</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2  rounded">
                      <div
                        className={`font-bold ${stats.comparisons.vsLastYear.ingresos >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatPercentage(stats.comparisons.vsLastYear.ingresos)}
                      </div>
                      <div className="text-xs text-muted-foreground">Ingresos</div>
                    </div>
                    <div className="text-center p-2  rounded">
                      <div
                        className={`font-bold ${stats.comparisons.vsLastYear.gastos <= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatPercentage(stats.comparisons.vsLastYear.gastos)}
                      </div>
                      <div className="text-xs text-muted-foreground">Gastos</div>
                    </div>
                    <div className="text-center p-2  rounded">
                      <div
                        className={`font-bold ${stats.comparisons.vsLastYear.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatPercentage(stats.comparisons.vsLastYear.balance)}
                      </div>
                      <div className="text-xs text-muted-foreground">Balance</div>
                    </div>
                  </div>
                </div>

                <div className="p-3  rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">vs Benchmark Industria</span>
                    <span
                      className={`font-bold ${stats.comparisons.industryBenchmark >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatPercentage(stats.comparisons.industryBenchmark)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Análisis Temporal</span>
                </CardTitle>
                <CardDescription>Patrones y tendencias por tiempo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.timeAnalysis.bestPerformingMonth && (
                  <div className="p-3 bg-green-50/50 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-600">Mejor Mes</p>
                        <p className="text-sm text-muted-foreground">{stats.timeAnalysis.bestPerformingMonth.month}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 break-all">
                          {formatCurrency(stats.timeAnalysis.bestPerformingMonth.balance)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {stats.timeAnalysis.worstPerformingMonth && (
                  <div className="p-3 bg-red-50/50 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-600">Mes Más Difícil</p>
                        <p className="text-sm text-muted-foreground">{stats.timeAnalysis.worstPerformingMonth.month}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600 break-all">
                          {formatCurrency(stats.timeAnalysis.worstPerformingMonth.balance)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-sm mb-3">Patrones por Día de la Semana</h4>
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {stats.timeAnalysis.weekdayPatterns.map((day, index) => (
                      <div key={index} className="text-center p-2  rounded">
                        <div className="font-medium">{day.day}</div>
                        <div className="text-blue-600 font-bold">{day.transactions}</div>
                        <div className="text-muted-foreground break-all">{formatCurrency(day.avgAmount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown Pie Chart */}
            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <PieChart className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span>Distribución de Gastos</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Porcentaje por categoría de gasto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {stats.categoryBreakdown.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-2 sm:w-3 h-2 sm:h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium text-xs sm:text-sm">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xs sm:text-sm break-all">{formatCurrency(category.value)}</div>
                          <div className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${category.percentage}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {stats.categoryBreakdown.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                      <PieChart className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay datos de gastos</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span>Tendencias Mensuales</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Ingresos vs gastos por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {stats.monthlyTrends.map((month, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs sm:text-sm">{month.month}</span>
                        <span
                          className={`font-bold text-xs sm:text-sm break-all ${month.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {formatCurrency(month.balance)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Ingresos</span>
                            <span className="text-xs font-medium text-blue-600 break-all">
                              {formatCurrency(month.ingresos)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="h-1 rounded-full bg-blue-500 transition-all duration-500"
                              style={{
                                width: `${month.ingresos > 0 ? Math.min((month.ingresos / Math.max(...stats.monthlyTrends.map((m) => m.ingresos))) * 100, 100) : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Gastos</span>
                            <span className="text-xs font-medium text-red-600 break-all">
                              {formatCurrency(month.gastos)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="h-1 rounded-full bg-red-500 transition-all duration-500"
                              style={{
                                width: `${month.gastos > 0 ? Math.min((month.gastos / Math.max(...stats.monthlyTrends.map((m) => m.gastos))) * 100, 100) : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {stats.monthlyTrends.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                      <BarChart3 className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay datos mensuales</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Expense Categories */}
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <DollarSign className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span>Top Categorías de Gastos</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Tus principales destinos de gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {stats.topExpenseCategories.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3  rounded-lg hover:bg-white/70 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-base font-bold text-indigo-600">#{index + 1}</div>
                        <div className="font-medium text-sm break-words">{category.category}</div>
                      </div>
                      <div className="text-sm font-bold text-red-600 break-all">{formatCurrency(category.amount)}</div>
                    </div>
                  ))}

                  {stats.topExpenseCategories.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                      <DollarSign className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay categorías de gastos</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
