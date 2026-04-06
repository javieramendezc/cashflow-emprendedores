"use client"
import { useEffect, useState } from "react"

const defaultForm = {
  type: "expense",
  label: "",
  amount: "",
  day: "",
}

export default function FutureMovementModal({
  isOpen,
  editingItem,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (!isOpen) return

    if (editingItem) {
      setForm({
        type: editingItem.type,
        label: editingItem.label,
        amount: String(editingItem.amount),
        day: String(editingItem.day),
      })
    } else {
      setForm(defaultForm)
    }
  }, [isOpen, editingItem])

  if (!isOpen) return null

  function handleSubmit(e) {
    e.preventDefault()

    const amount = Number(form.amount)
    const day = Number(form.day)

    if (!form.label.trim() || amount <= 0 || day < 1 || day > 31) return

    onSave({
      id: editingItem?.id ?? Date.now(),
      type: form.type,
      label: form.label.trim(),
      amount,
      day,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingItem ? "Editar movimiento" : "Agregar movimiento futuro"}
          </h2>

          <button onClick={onClose} className="text-sm text-gray-500">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: "income" }))}
              className={`flex-1 py-2 rounded-xl border ${
                form.type === "income"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              Ingreso
            </button>

            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: "expense" }))}
              className={`flex-1 py-2 rounded-xl border ${
                form.type === "expense"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              Gasto
            </button>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Concepto</label>
            <input
              autoFocus
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Ej. Arriendo"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Monto</label>
            <input
              type="number"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Ej. 350000"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Día del mes</label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              value={form.day}
              onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value }))}
              placeholder="Ej. 5"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-gray-900 text-white py-3 font-medium"
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  )
}
