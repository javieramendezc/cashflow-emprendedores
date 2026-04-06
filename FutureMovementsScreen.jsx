"use client"

import FutureMovementItem from "./FutureMovementItem"

export default function FutureMovementsScreen({
  futureMovements,
  onAdd,
  onEdit,
  onDelete,
  onBack,
}) {
  const sortedMovements = [...futureMovements].sort((a, b) => a.day - b.day)

  return (
    <div className="mx-auto min-h-screen max-w-md space-y-6 bg-[#FAFAF9] px-5 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Próximos movimientos
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Lo que ya sabes que viene este mes
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700"
            >
              Volver
            </button>
          ) : null}

          <button
            onClick={onAdd}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white"
          >
            + Agregar
          </button>
        </div>
      </div>

      {sortedMovements.length === 0 ? (
        <div className="space-y-2">
          <p className="text-gray-700">Aún no tienes movimientos futuros</p>
          <p className="text-sm text-gray-500">
            Agrega gastos o ingresos que ya sabes que vienen para mejorar tu proyección
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border-b border-t border-gray-100">
          {sortedMovements.map((item) => (
            <FutureMovementItem
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
