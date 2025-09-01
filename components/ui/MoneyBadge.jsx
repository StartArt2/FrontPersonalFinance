// components/ui/MoneyBadge.jsx
import React from "react";
import { formatCurrencyFull, formatCurrencyCompact } from "../../lib/formatters";

export default function MoneyBadge({ amount, compactAt = 1_000_000, className = "" }) {
  const showCompact = Math.abs(amount) >= compactAt;
  const compact = formatCurrencyCompact(amount);
  const full = formatCurrencyFull(amount);

  return (
    <div
      className={`inline-block ${className}`}
      title={full}          // hover muestra el valor completo
      aria-label={`Cantidad: ${full}`}
    >
      <span className="whitespace-nowrap">
        {/* si es grande muestra compacto + icono, sino el full */}
        {showCompact ? (
          <><span className="font-bold">{compact}</span></>
        ) : (
          <span className="font-bold">{full}</span>
        )}
      </span>
    </div>
  );
}
