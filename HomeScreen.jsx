"use client"

import { useEffect, useMemo, useState } from "react"
import AddMovementModal from "./AddMovementModal"

const INITIAL_MOVEMENTS = [
  { id: 1, type: "expense", label: "Uber", amount: 8000, date: "Hoy" },
  { id: 2, type: "income", label: "Venta", amount: 120000, date: "Hoy" },
]

function formatMoney(value) {
  return `$${Math.abs(value).toLocaleString("es-CL")}`
}

function getMonthEndTone(projectedMoney, safeMinimum) {
  if (projectedMoney <= 0 || projectedMoney <= safeMinimum) {
    return {
      valueClass: "text-red-500",
      insightClass: "text-red-600",
      insight: "Te estás quedando sin dinero",
    }
  }

  if (projectedMoney <= safeMinimum * 1.3) {
    return {
      valueClass: "text-yellow-500",
      insightClass: "text-gray-600",
      insight: "Vas ajustada",
    }
  }

  return {
    valueClass: "text-green-500",
    insightClass: "text-gray-600",
    insight: "Vas bien",
  }
}

export default function HomeScreen() {
  const [screenState, setScreenState] = useState("loading")
  const [modalType, setModalType] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [safeMinimum, setSafeMinimum] = useState(200000)
  const [movements, setMovements] = useState([])

  const money = useMemo(() => {
    return movements.reduce((acc, movement) => {
      return movement.type === "income" ? acc + movement.amount : acc - movement.amount
    }, 0)
  }, [movements])

  const onboardingCount = movements.length
  const isOnboarding = onboardingCount < 3
  const projectedMonthEnd = Math.max(money - 10000, 0)
  const weeklyBudget = Math.max(Math.floor((projectedMonthEnd - safeMinimum) / 4 / 1000) * 1000, 0)
  const tone = getMonthEndTone(projectedMonthEnd, safeMinimum)

  useEffect(() => {
    loadHome()
  }, [])

  useEffect(() => {
    if (!feedback) {
      return undefined
    }

    const timer = setTimeout(() => setFeedback(""), 2500)
    return () => clearTimeout(timer)
  }, [feedback])

  async function loadHome() {
    try {
      setScreenState("loading")

      // Reemplazar por fetch o carga real cuando exista backend.
      await Promise.resolve()

      setMovements(INITIAL_MOVEMENTS)
      setScreenState("ready")
    } catch {
      setScreenState("error")
    }
  }

  function handleRetry() {
    loadHome()
  }

  function handleAddMovement(newMovement) {
    const movementToSave = {
      id: Date.now(),
      ...newMovement,
      date: "Hoy",
    }

    const nextMoney =
      newMovement.type === "income"
        ? money + newMovement.amount
        : money - newMovement.amount

    setMovements((prev) => [movementToSave, ...prev])
    setModalType(null)
    setFeedback(`Listo. Ahora tienes ${formatMoney(nextMoney)}`)
  }

  if (screenState === "loading") {
    return (
      <main className="min-h-screen bg-[#FAFAF9] px-5 py-8">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </main>
    )
  }

  if (screenState === "error") {
    return (
      <main className="min-h-screen bg-[#FAFAF9] px-5 py-8">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <section className="space-y-3 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Ups, algo no salió bien
            </h1>
            <p className="text-sm text-gray-500">Inténtalo de nuevo</p>
            <button
              onClick={handleRetry}
              className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-105"
            >
              Reintentar
            </button>
          </section>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="min-h-screen max-w-md space-y-6 bg-[#FAFAF9] px-5 py-8">
        {feedback ? (
          <div className="rounded-xl bg-gray-900 px-4 py-3 text-sm text-white">
            {feedback}
          </div>
        ) : null}

        <section>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            {money < 0 ? `-${formatMoney(money)}` : formatMoney(money)}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Hoy tienes disponible</p>
        </section>

        {isOnboarding ? (
          <section className="space-y-2">
            <p className="text-gray-700">Aún estamos aprendiendo de tu dinero</p>
            <p className="text-sm text-gray-500">
              Llevas {onboardingCount} de 3 movimientos
            </p>
            <p className="text-sm text-gray-600">
              Agrega {3 - onboardingCount} más para ver tu proyección
            </p>
          </section>
        ) : (
          <>
            <section className="text-gray-700">
              Fin de mes:{" "}
              <span className={`font-medium ${tone.valueClass}`}>
                {formatMoney(projectedMonthEnd)}
              </span>
            </section>

            <section className={`text-sm ${tone.insightClass}`}>
              {tone.insight === "Te estás quedando sin dinero"
                ? "Ojo: te estás quedando sin dinero para cerrar el mes con calma"
                : weeklyBudget > 0
                  ? `Puedes gastar hasta ${formatMoney(weeklyBudget)} esta semana`
                  : tone.insight}
            </section>
          </>
        )}

        <section className="flex gap-3">
          <button
            onClick={() => setModalType("income")}
            className="flex-1 rounded-xl bg-gray-900 py-2 text-white"
          >
            + Ingreso
          </button>
          <button
            onClick={() => setModalType("expense")}
            className="flex-1 rounded-xl bg-gray-100 py-2 text-gray-800"
          >
            - Gasto
          </button>
        </section>

        <section className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Mínimo seguro
          </p>

          <input
            type="number"
            value={safeMinimum}
            onChange={(event) => setSafeMinimum(Number(event.target.value) || 0)}
            placeholder="Ej. 200000"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none"
          />

          <p className="text-sm text-gray-500">
            Define tu mínimo seguro para activar alertas.
          </p>
        </section>

        <section className="border-t border-gray-100 pt-4 text-sm">
          <p className="mb-2 text-gray-500">Hoy</p>

          <div className="divide-y divide-gray-100">
            {movements.map((movement) => (
              <div key={movement.id} className="flex justify-between py-3">
                <span className="text-gray-900">{movement.label}</span>
                <span
                  className={
                    movement.type === "income" ? "text-green-600" : "text-gray-800"
                  }
                >
                  {movement.type === "income" ? "+" : "-"}
                  {formatMoney(movement.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AddMovementModal
        isOpen={modalType !== null}
        type={modalType}
        onClose={() => setModalType(null)}
        onSave={handleAddMovement}
      />
    </>
  )
}
