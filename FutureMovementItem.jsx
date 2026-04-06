"use client"

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

export default function FutureMovementItem({ item, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {item.label}
        </p>
        <p className="text-xs text-gray-500">
          Día {item.day} · {item.type === "income" ? "Ingreso" : "Gasto"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`text-sm font-medium ${
            item.type === "income" ? "text-green-600" : "text-gray-800"
          }`}
        >
          {item.type === "income" ? "+" : "-"}
          {formatMoney(item.amount)}
        </span>

        <button
          onClick={() => onEdit(item)}
          className="text-xs text-gray-500"
        >
          Editar
        </button>

        <button
          onClick={() => onDelete(item.id)}
          className="text-xs text-red-500"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
