// Utilidades para formatear números y monedas
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "$0"
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return "0"
  }

  return new Intl.NumberFormat("es-CO").format(number)
}

// Función para parsear input de usuario y convertir a número
export const parseCurrencyInput = (value) => {
  if (!value) return 0
  // Remover todo excepto números, puntos y comas
  const cleanValue = value.toString().replace(/[^\d.,]/g, "")
  // Convertir coma decimal a punto
  const normalizedValue = cleanValue.replace(",", ".")
  return Number.parseFloat(normalizedValue) || 0
}

export function formatCurrencyFull(amount, locale = "es-CO", currency = "COP") {
  if (amount == null) return "0";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount, locale = "es-CO", currency = "COP") {
  if (amount == null) return "0";
  // Notación compacta (ej: 1.2M)
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: "compact",
    compactDisplay: "short",
  }).format(amount);
}