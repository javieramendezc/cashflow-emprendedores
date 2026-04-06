"use client"

import { useEffect, useRef, useState } from "react"

const DEFAULT_TYPE = "expense"

function normalizeAmount(value) {
  return value.replace(/[^\d]/g, "")
}

export default function AddMovementModal({
  isOpen,
  type,
  onClose,
  onSave,
}) {
  const amountInputRef = useRef(null)

  const [movementType, setMovementType] = useState(type || DEFAULT_TYPE)
  const [amount, setAmount] = useState("")
  const [label, setLabel] = useState("")
  const [note, setNote] = useState("")
  const [showDetails, setShowDetails] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setMovementType(type || DEFAULT_TYPE)
      setAmount("")
      setLabel("")
      setNote("")
      setShowDetails(false)
      setFormError("")
      return
    }

    setMovementType(type || DEFAULT_TYPE)
    setFormError("")

    const timer = setTimeout(() => {
      amountInputRef.current?.focus()
    }, 60)

    return () => clearTimeout(timer)
  }, [isOpen, type])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose?.()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose?.()
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    const parsedAmount = Number(amount)
    const cleanLabel = label.trim()

    if (!parsedAmount || parsedAmount <= 0) {
      setFormError("Ingresa un monto válido.")
      return
    }

    if (!cleanLabel) {
      setFormError("Escribe un concepto corto.")
      return
    }

    setFormError("")

    onSave?.({
      type: movementType,
      label: cleanLabel,
      amount: parsedAmount,
      note: note.trim(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 px-3 py-3 sm:items-center"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Agregar movimiento"
    >
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(17,24,39,0.18)]">
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Nuevo movimiento
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Agrega plata en segundos
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-5 pb-5 sm:px-6">
            <div className="space-y-2">
              <label
                htmlFor="movement-amount"
                className="block text-sm font-medium text-gray-500"
              >
                Monto
              </label>
              <input
                id="movement-amount"
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={amount}
                onChange={(event) => {
                  setAmount(normalizeAmount(event.target.value))
                  if (formError) {
                    setFormError("")
                  }
                }}
                placeholder="Ej. 12000"
                className="w-full rounded-[24px] border border-gray-200 px-4 py-4 text-3xl font-semibold tracking-tight text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-900"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-gray-500">Tipo</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMovementType("income")}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    movementType === "income"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  + Ingreso
                </button>

                <button
                  type="button"
                  onClick={() => setMovementType("expense")}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    movementType === "expense"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  - Gasto
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="movement-label"
                className="block text-sm font-medium text-gray-500"
              >
                Concepto
              </label>
              <input
                id="movement-label"
                value={label}
                onChange={(event) => {
                  setLabel(event.target.value)
                  if (formError) {
                    setFormError("")
                  }
                }}
                placeholder={movementType === "income" ? "Ej. Venta" : "Ej. Uber"}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-900"
              />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowDetails((value) => !value)}
                className="text-sm font-medium text-gray-600 underline-offset-4 transition hover:text-gray-900 hover:underline"
              >
                {showDetails ? "Ocultar detalles" : "Más detalles"}
              </button>

              {showDetails ? (
                <div className="space-y-2">
                  <label
                    htmlFor="movement-note"
                    className="block text-sm font-medium text-gray-500"
                  >
                    Nota
                  </label>
                  <input
                    id="movement-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-900"
                  />
                </div>
              ) : null}
            </div>

            {formError ? (
              <p className="text-sm font-medium text-red-600">{formError}</p>
            ) : null}
          </div>

          <div className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-200"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex-1 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:scale-[1.02]"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
