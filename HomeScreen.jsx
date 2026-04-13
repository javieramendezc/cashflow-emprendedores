"use client"

import { useEffect, useMemo, useState } from "react"
import AddMovementModal from "./AddMovementModal"
import { emitCashflowStateChange } from "./cashflowGlobalState"
import { formatCurrency, formatCurrencySigned } from "./formatCurrency"

const MOVEMENTS_KEY = "movements"
const SAFE_MINIMUM_KEY = "safeMinimum"
const FUTURE_MOVEMENTS_KEY = "futureMovements"

function normalizeMovement(rawMovement) {
  const amount = Number(rawMovement?.amount)
  const label = String(rawMovement?.label || "").trim()
  const type = rawMovement?.type === "income" ? "income" : "expense"

  if (!label || !Number.isFinite(amount) || amount <= 0) {
    return null
  }

  return {
    id: rawMovement?.id ?? Date.now(),
    type,
    label,
    amount,
    date: rawMovement?.date || new Date().toISOString().slice(0, 10),
    createdAt: rawMovement?.createdAt || new Date().toISOString(),
  }
}

function normalizeFutureMovement(rawMovement) {
  const amount = Number(rawMovement?.amount)
  const day = Number(rawMovement?.day)
  const label = String(rawMovement?.label || "").trim()
  const type = rawMovement?.type === "income" ? "income" : "expense"

  if (
    !label ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(day) ||
    day < 1 ||
    day > 31
  ) {
    return null
  }

  return {
    id: rawMovement?.id ?? Date.now(),
    type,
    label,
    amount,
    day,
  }
}

function getRemainingWeeksInMonth() {
  const now = new Date()
  const today = now.getDate()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.max(1, Math.ceil((lastDay - today + 1) / 7))
}

export default function HomeScreen() {
  const [error, setError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [feedback, setFeedback] = useState("")

  const [movements, setMovements] = useState([])
  const [safeMinimum, setSafeMinimum] = useState(200000)
  const [futureMovements, setFutureMovements] = useState([])

  useEffect(() => {
    loadStoredData()
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements))
      emitCashflowStateChange()
    } catch (caughtError) {
      console.error(caughtError)
      setError(true)
    }
  }, [isLoaded, movements])

  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(SAFE_MINIMUM_KEY, String(safeMinimum))
      emitCashflowStateChange()
    } catch (caughtError) {
      console.error(caughtError)
      setError(true)
    }
  }, [isLoaded, safeMinimum])

  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(FUTURE_MOVEMENTS_KEY, JSON.stringify(futureMovements))
      emitCashflowStateChange()
    } catch (caughtError) {
      console.error(caughtError)
      setError(true)
    }
  }, [futureMovements, isLoaded])

  useEffect(() => {
    if (!feedback) return undefined

    const timer = setTimeout(() => setFeedback(""), 2400)
    return () => clearTimeout(timer)
  }, [feedback])

  const money = useMemo(() => {
    return movements.reduce((total, movement) => {
      return movement.type === "income"
        ? total + movement.amount
        : total - movement.amount
    }, 0)
  }, [movements])

  const projection = useMemo(() => {
    const today = new Date().getDate()
    const sortedFuture = [...futureMovements]
      .map(normalizeFutureMovement)
      .filter(Boolean)
      .sort((left, right) => left.day - right.day)

    let runningBalance = money
    let criticalDay = null

    sortedFuture.forEach((item) => {
      if (item.day < today) {
        return
      }

      runningBalance += item.type === "income" ? item.amount : -item.amount

      if (runningBalance <= safeMinimum && criticalDay === null) {
        criticalDay = item.day
      }
    })

    return {
      finalBalance: runningBalance,
      criticalDay,
    }
  }, [futureMovements, money, safeMinimum])

  const screenState = error ? "error" : movements.length < 3 ? "onboarding" : "normal"
  const remainingWeeks = useMemo(() => getRemainingWeeksInMonth(), [])
  const safeToSpend = Math.max(projection.finalBalance - safeMinimum, 0)
  const weeklyDecisionAmount = useMemo(() => {
    if (screenState === "onboarding") {
      return Math.max(0, Math.floor(Math.max(money, 0) / remainingWeeks / 1000) * 1000)
    }

    return Math.max(0, Math.floor(safeToSpend / remainingWeeks / 1000) * 1000)
  }, [money, remainingWeeks, safeToSpend, screenState])

  const todayMovements = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const todayItems = movements.filter(
      (movement) => movement.date === todayKey || movement.date === "Hoy"
    )
    const visibleMovements = todayItems.length ? todayItems : movements
    return visibleMovements.slice(0, 6)
  }, [movements])

  const decision = useMemo(() => {
    if (screenState === "onboarding") {
      const remaining = Math.max(1, 3 - movements.length)

      return {
        tone: "neutral",
        title: "Aún no te digo si conviene gastar hoy",
        context: `Agrega ${remaining} movimiento${remaining === 1 ? "" : "s"} más.`,
      }
    }

    if (projection.finalBalance <= safeMinimum || projection.criticalDay !== null) {
      return {
        tone: "critical",
        title: "Mejor no gastar hoy",
        context:
          projection.criticalDay !== null
            ? `Podrías apretarte desde el día ${projection.criticalDay}.`
            : "Tu semana ya viene justa.",
      }
    }

    if (weeklyDecisionAmount <= 50000) {
      return {
        tone: "warning",
        title: "Puedes gastar, pero con cuidado",
        context: "Si gastas, que sea algo chico.",
      }
    }

    return {
      tone: "positive",
      title: "Puedes gastar hoy sin problema",
      context: "Tu semana todavía tiene aire.",
    }
  }, [movements.length, projection.criticalDay, projection.finalBalance, safeMinimum, screenState, weeklyDecisionAmount])

  const decisionToneClass =
    decision.tone === "critical"
      ? "text-[#EF4444]"
      : decision.tone === "warning"
        ? "text-[#B45309]"
        : decision.tone === "positive"
          ? "text-[#15803D]"
          : "text-[#111827]"

  function loadStoredData() {
    try {
      const storedMovements = localStorage.getItem(MOVEMENTS_KEY)
      const storedMinimum = localStorage.getItem(SAFE_MINIMUM_KEY)
      const storedFutureMovements = localStorage.getItem(FUTURE_MOVEMENTS_KEY)

      if (storedMovements) {
        const parsedMovements = JSON.parse(storedMovements)
        setMovements(
          Array.isArray(parsedMovements)
            ? parsedMovements.map(normalizeMovement).filter(Boolean)
            : []
        )
      } else {
        setMovements([])
      }

      if (storedMinimum) {
        setSafeMinimum(Number(storedMinimum) || 0)
      } else {
        setSafeMinimum(200000)
      }

      if (storedFutureMovements) {
        const parsedFutureMovements = JSON.parse(storedFutureMovements)
        setFutureMovements(
          Array.isArray(parsedFutureMovements)
            ? parsedFutureMovements.map(normalizeFutureMovement).filter(Boolean)
            : []
        )
      } else {
        setFutureMovements([])
      }

      setError(false)
    } catch (caughtError) {
      console.error(caughtError)
      setError(true)
    } finally {
      setIsLoaded(true)
    }
  }

  function handleAddMovement(newMovement) {
    try {
      const movementToSave = normalizeMovement({
        id: Date.now(),
        ...newMovement,
        date: new Date().toISOString().slice(0, 10),
      })

      if (!movementToSave) {
        return
      }

      const nextMoney =
        movementToSave.type === "income"
          ? money + movementToSave.amount
          : money - movementToSave.amount

      setMovements((previous) => [movementToSave, ...previous])
      setModalType(null)
      setFeedback(`Listo. Te quedan ${formatCurrency(nextMoney)}.`)
    } catch (caughtError) {
      console.error(caughtError)
      setError(true)
    }
  }

  function handleRetry() {
    loadStoredData()
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#FAFAF9] px-5 py-6">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <section className="space-y-3 text-center">
            <h1 className="text-2xl font-semibold text-[#111827]">
              Ups, algo no salió bien
            </h1>
            <p className="text-sm text-[#6B7280]">
              Reintenta y seguimos.
            </p>
            <button
              onClick={handleRetry}
              className="rounded-xl bg-[#111827] px-4 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-105"
            >
              Reintentar
            </button>
          </section>
        </div>
      </main>
    )
  }

  if (!isLoaded) {
    return <main className="min-h-screen bg-[#FAFAF9] px-5 py-6" />
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9] px-5 py-6">
      <div className="mx-auto max-w-md space-y-6">
        {feedback ? (
          <p className="rounded-full bg-[#111827] px-4 py-2 text-sm text-white">
            {feedback}
          </p>
        ) : null}

        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
            Decisión de hoy
          </p>
          <h1 className={`text-4xl font-semibold leading-tight tracking-tight ${decisionToneClass}`}>
            {decision.title}
          </h1>
          <p className="text-sm text-[#6B7280]">
            {decision.context}
          </p>
        </section>

        <section className="space-y-1">
          <p className="text-4xl font-semibold tracking-tight text-[#111827]">
            {formatCurrency(weeklyDecisionAmount)}
          </p>
          <p className="text-sm text-[#6B7280]">
            Te quedan para esta semana
          </p>
        </section>

        <section className="flex gap-3">
          <button
            onClick={() => setModalType("income")}
            className="flex-1 rounded-xl bg-[#111827] px-4 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-105"
          >
            + Ingreso
          </button>
          <button
            onClick={() => setModalType("expense")}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-[#111827] transition-transform duration-150 hover:scale-105"
          >
            - Gasto
          </button>
        </section>

        <section>
          <p className="text-sm text-[#6B7280]">
            Si sigues así, terminas con {formatCurrency(projection.finalBalance)}
          </p>
        </section>

        <section className="border-t border-gray-100 pt-4">
          <p className="mb-2 text-sm text-[#6B7280]">Hoy</p>

          {todayMovements.length ? (
            <div className="divide-y divide-gray-100">
              {todayMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="min-w-0 truncate pr-4 text-[#111827]">
                    {movement.label}
                  </span>
                  <span
                    className={
                      movement.type === "income"
                        ? "shrink-0 text-[#22C55E]"
                        : "shrink-0 text-[#111827]"
                    }
                  >
                    {formatCurrencySigned(movement.amount, movement.type)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">
              Agrega un movimiento y te digo qué conviene.
            </p>
          )}
        </section>
      </div>

      <AddMovementModal
        isOpen={modalType !== null}
        type={modalType}
        onClose={() => setModalType(null)}
        onSave={handleAddMovement}
      />
    </main>
  )
}
