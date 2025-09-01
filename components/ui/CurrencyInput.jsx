"use client"

import { formatNumber, parseCurrencyInput } from "@/lib/formatters"

// Componente de input para moneda
export const CurrencyInput = ({ value, onChange, ...props }) => {
  const handleChange = (e) => {
    const inputValue = e.target.value
    const numericValue = parseCurrencyInput(inputValue)
    onChange(numericValue)
  }

  const displayValue = value ? formatNumber(value) : ""

  return <input {...props} type="text" value={displayValue} onChange={handleChange} placeholder="0" />
}

export default CurrencyInput
