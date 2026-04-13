"use client"

const CLP_FORMATTER = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
})

export function formatCurrency(value) {
  return CLP_FORMATTER.format(Number(value) || 0)
}

export function formatCurrencySigned(value, type) {
  const abs = Math.abs(Number(value) || 0)
  const prefix = type === "income" ? "+" : "-"
  return `${prefix}${CLP_FORMATTER.format(abs)}`
}

export function formatCurrencyAbs(value) {
  return CLP_FORMATTER.format(Math.abs(Number(value) || 0))
}
