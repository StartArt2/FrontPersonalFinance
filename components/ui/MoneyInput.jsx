"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

export default function MoneyInput({ value, onChange, placeholder = "0", className = "", ...props }) {
  const [displayValue, setDisplayValue] = useState("")

  useEffect(() => {
    if (value) {
      setDisplayValue(formatMoney(value.toString()))
    } else {
      setDisplayValue("")
    }
  }, [value])

  const formatMoney = (value) => {
    // Remover todo excepto números
    const numbers = value.replace(/[^\d]/g, "")
    if (!numbers) return ""

    // Formatear con puntos como separadores de miles
    return new Intl.NumberFormat("es-CO").format(Number.parseInt(numbers))
  }

  const handleChange = (e) => {
    const inputValue = e.target.value
    const formattedValue = formatMoney(inputValue)
    setDisplayValue(formattedValue)

    // Enviar solo números al componente padre
    const numericValue = inputValue.replace(/[^\d]/g, "")
    onChange(numericValue ? Number.parseInt(numericValue) : "")
  }

  return (
    <Input
      {...props}
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  )
}
