"use client"

import { useEffect, useMemo, useState } from "react"
import AddMovementModal from "./AddMovementModal"

const STORAGE_KEYS = {
  movements: "cashflow-home-movements",
  safeMinimum: "cashflow-home-safe-minimum",
}

const DEFAULT_SAFE_MINIMUM = 200000

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

const INITIAL_MOVEMENTS = [
  { id: 1, type: "expense", label: "Uber", amount: 8000, date: getTodayIsoDate() },
  { id: 2, type: "income", label: "Venta", amount: 120000, date: getTodayIsoDate() },
]

function formatMoney(value) {
  return `$${Math.abs(value).toLocaleString("es-CL")}`
}

function formatSignedMoney(value) {
  return value < 0 ? `-${formatMoney(value)}` : formatMoney(value)
}

function normalizeMovement(rawMovement) {
  const amount = Number(rawMovement?.amount)
  const type = rawMovement?.type === "income" ? "income" : "expense"
  const label = String(rawMovement?.label || "").trim()
  const date = String(rawMovement?.date || getTodayIsoDate())

  if (!label || !amount || amount <= 0) {
    return null
  }

  return {
    id: rawMovement?.id || Date.now(),
    type,
    label,
    amount,
    date,
  }
}

function isCurrentMonth(dateValue) {
  if (!dateValue) {
    return false
  }

  const currentMonth = getTodayIsoDate().slice(0, 7)
  return String(dateValue).slice(0, 7) === currentMonth
}

function isToday(dateValue) {
  return String(dateValue) === getTodayIsoDate()
}

function formatMovementDay(dateValue) {
  if (isToday(dateValue)) {
    return "Hoy"
  }

  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return "Hoy"
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
  }).format(parsedDate)
}

function getMonthEndTone({ availableMoney, projectedMoney, safeMinimum }) {
  if (availableMoney <= safeMinimum || projectedMoney <= safeMinimum) {
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
  const [safeMinimum, setSafeMinimum] = useState(DEFAULT_SAFE_MINIMUM)
  const [movements, setMovements] = useState([])

  const money = useMemo(() => {
    return movements.reduce((acc, movement) => {
      return movement.type === "income" ? acc + movement.amount : acc - movement.amount
    }, 0)
  }, [movements])

  const currentMonthMovements = useMemo(() => {
    return movements.filter((movement) => isCurrentMonth(movement.date))
  }, [movements])

  const onboardingCount = movements.length
  const isOnboarding = onboardingCount < 3
  const projectedMonthEnd = useMemo(() => {
    if (!currentMonthMovements.length) {
      return money
    }

    const today = new Date()
    const elapsedDays = Math.max(today.getDate(), 1)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const remainingDays = Math.max(daysInMonth - elapsedDays, 0)

    const monthNet = currentMonthMovements.reduce((acc, movement) => {
      return movement.type === "income" ? acc + movement.amount : acc - movement.amount
    }, 0)

    const averageDailyNet = monthNet / elapsedDays
    return Math.round(money + averageDailyNet * remainingDays)
  }, [currentMonthMovements, money])

  const weeklyBudget = Math.max(
    Math.floor((projectedMonthEnd - safeMinimum) / 4 / 1000) * 1000,
    0
  )
  const isCritical = money <= safeMinimum
  const tone = getMonthEndTone({
    availableMoney: money,
    projectedMoney: projectedMonthEnd,
    safeMinimum,
  })

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

  useEffect(() => {
    if (screenState !== "ready") {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.movements, JSON.stringify(movements))
      window.localStorage.setItem(STORAGE_KEYS.safeMinimum, String(safeMinimum))
    } catch {
      // Mantiene la pantalla usable aunque falle la persistencia local.
    }
  }, [movements, safeMinimum, screenState])

  async function loadHome() {
    try {
      setScreenState("loading")

      await Promise.resolve()

      const storedMovements = window.localStorage.getItem(STORAGE_KEYS.movements)
      const storedSafeMinimum = window.localStorage.getItem(STORAGE_KEYS.safeMinimum)

      const parsedMovements = storedMovements
        ? JSON.parse(storedMovements).map(normalizeMovement).filter(Boolean)
        : INITIAL_MOVEMENTS

      const parsedSafeMinimum = Number(storedSafeMinimum)

      setMovements(parsedMovements.length ? parsedMovements : INITIAL_MOVEMENTS)
      setSafeMinimum(parsedSafeMinimum > 0 ? parsedSafeMinimum : DEFAULT_SAFE_MINIMUM)
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
      date: getTodayIsoDate(),
    }

    const nextMoney =
      newMovement.type === "income"
        ? money + newMovement.amount
        : money - newMovement.amount

    setMovements((prev) => [movementToSave, ...prev])
    setModalType(null)
    setFeedback(
      `${newMovement.type === "income" ? "Ingreso guardado." : "Gasto guardado."} Ahora tienes ${formatSignedMoney(nextMoney)}`
    )
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
      <main className="mx-auto min-h-screen max-w-md space-y-6 bg-[#FAFAF9] px-5 py-8">
        {feedback ? (
          <div className="rounded-xl bg-gray-900 px-4 py-3 text-sm text-white">
            {feedback}
          </div>
        ) : null}

        <section>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            {formatSignedMoney(money)}
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
                {formatSignedMoney(projectedMonthEnd)}
              </span>
            </section>

            <section className={`text-sm ${tone.insightClass}`}>
              {isCritical
                ? "Ojo: ya estás por debajo de tu mínimo seguro."
                : tone.insight === "Te estás quedando sin dinero"
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
                <div className="min-w-0 pr-4">
                  <span className="block truncate text-gray-900">{movement.label}</span>
                  <span className="text-xs text-gray-400">
                    {formatMovementDay(movement.date)}
                  </span>
                </div>
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
