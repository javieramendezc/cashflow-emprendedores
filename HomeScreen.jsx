"use client"

import { useEffect, useMemo, useState } from "react"
import AddMovementModal from "./AddMovementModal"
import FutureMovementModal from "./FutureMovementModal"
import FutureMovementsScreen from "./FutureMovementsScreen"

const MOVEMENTS_KEY = "movements"
const FUTURE_MOVEMENTS_KEY = "futureMovements"
const SAFE_MINIMUM_KEY = "safeMinimum"

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
    date: rawMovement?.date || "Hoy",
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

export default function HomeScreen() {
  const [error, setError] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [showFutureScreen, setShowFutureScreen] = useState(false)
  const [futureModalOpen, setFutureModalOpen] = useState(false)
  const [editingFutureMovement, setEditingFutureMovement] = useState(null)

  const [movements, setMovements] = useState([])
  const [futureMovements, setFutureMovements] = useState([])
  const [safeMinimum, setSafeMinimum] = useState(200000)

  useEffect(() => {
    loadStoredData()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements))
    } catch (storageError) {
      console.error(storageError)
    }
  }, [movements])

  useEffect(() => {
    try {
      localStorage.setItem(FUTURE_MOVEMENTS_KEY, JSON.stringify(futureMovements))
    } catch (storageError) {
      console.error(storageError)
    }
  }, [futureMovements])

  useEffect(() => {
    try {
      localStorage.setItem(SAFE_MINIMUM_KEY, String(safeMinimum))
    } catch (storageError) {
      console.error(storageError)
    }
  }, [safeMinimum])

  useEffect(() => {
    if (!feedback) return undefined
    const timer = setTimeout(() => setFeedback(""), 2500)
    return () => clearTimeout(timer)
  }, [feedback])

  const money = useMemo(() => {
    return movements.reduce((acc, movement) => {
      return movement.type === "income" ? acc + movement.amount : acc - movement.amount
    }, 0)
  }, [movements])

  const projection = useMemo(() => {
    let balance = money
    let criticalDay = null

    const today = new Date()
    const currentDay = today.getDate()
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate()

    const movementsByDay = futureMovements.reduce((acc, movement) => {
      const normalized = normalizeFutureMovement(movement)

      if (!normalized || normalized.day < currentDay || normalized.day > lastDayOfMonth) {
        return acc
      }

      if (!acc[normalized.day]) {
        acc[normalized.day] = []
      }

      acc[normalized.day].push(normalized)
      return acc
    }, {})

    for (let day = currentDay; day <= lastDayOfMonth; day += 1) {
      const movementsToday = movementsByDay[day] || []

      movementsToday.forEach((movement) => {
        balance += movement.type === "income" ? movement.amount : -movement.amount
      })

      if (balance <= safeMinimum && criticalDay === null) {
        criticalDay = day
      }
    }

    return {
      finalBalance: balance,
      criticalDay,
    }
  }, [futureMovements, money, safeMinimum])

  const onboardingCount = movements.length
  const isOnboarding = onboardingCount < 3
  const isCritical = money <= safeMinimum || projection.finalBalance <= safeMinimum
  const safeToSpend = Math.max(money - safeMinimum, 0)

  function loadStoredData() {
    try {
      const storedMovements = localStorage.getItem(MOVEMENTS_KEY)
      const storedFutureMovements = localStorage.getItem(FUTURE_MOVEMENTS_KEY)
      const storedMinimum = localStorage.getItem(SAFE_MINIMUM_KEY)

      if (storedMovements) {
        const parsedMovements = JSON.parse(storedMovements)
          .map(normalizeMovement)
          .filter(Boolean)
        setMovements(parsedMovements)
      }

      if (storedFutureMovements) {
        const parsedFutureMovements = JSON.parse(storedFutureMovements)
          .map(normalizeFutureMovement)
          .filter(Boolean)
        setFutureMovements(parsedFutureMovements)
      }

      if (storedMinimum) {
        setSafeMinimum(Number(storedMinimum) || 0)
      }

      setError(false)
    } catch (storageError) {
      console.error(storageError)
      setError(true)
    }
  }

  function handleAddMovement(newMovement) {
    try {
      const movementToSave = normalizeMovement({
        id: Date.now(),
        ...newMovement,
        date: "Hoy",
      })

      if (!movementToSave) {
        return
      }

      const nextMoney =
        movementToSave.type === "income"
          ? money + movementToSave.amount
          : money - movementToSave.amount

      setMovements((prev) => [movementToSave, ...prev])
      setModalType(null)
      setFeedback(`Ahora tienes $${nextMoney.toLocaleString("es-CL")}`)
    } catch (movementError) {
      console.error(movementError)
      setError(true)
    }
  }

  function handleRetry() {
    loadStoredData()
  }

  function getInsight() {
    if (projection.criticalDay) {
      const daysLeft = projection.criticalDay - new Date().getDate()

      if (daysLeft <= 0) {
        return "Ojo: hoy podrías tener problemas"
      }

      if (daysLeft === 1) {
        return "Ojo: mañana podrías tener problemas"
      }

      return `Ojo: en ${daysLeft} días podrías tener problemas`
    }

    if (money > safeMinimum) {
      return "Vas bien. Puedes gastar con tranquilidad"
    }

    return "Mantente atenta a tus gastos"
  }

  function simulateExpense(amount) {
    return money - amount <= safeMinimum
  }

  function handleOpenAddFuture() {
    setEditingFutureMovement(null)
    setFutureModalOpen(true)
  }

  function handleEditFuture(item) {
    setEditingFutureMovement(item)
    setFutureModalOpen(true)
  }

  function handleSaveFuture(item) {
    const normalized = normalizeFutureMovement(item)
    if (!normalized) {
      return
    }

    setFutureMovements((prev) => {
      const exists = prev.some((movement) => movement.id === normalized.id)

      if (exists) {
        return prev.map((movement) =>
          movement.id === normalized.id ? normalized : movement
        )
      }

      return [normalized, ...prev]
    })

    setFutureModalOpen(false)
    setEditingFutureMovement(null)
    setFeedback("Movimiento futuro guardado")
  }

  function handleDeleteFuture(id) {
    setFutureMovements((prev) => prev.filter((item) => item.id !== id))
    setFeedback("Movimiento futuro eliminado")
  }

  function handleCloseFutureModal() {
    setFutureModalOpen(false)
    setEditingFutureMovement(null)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] px-6">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Algo no funcionó bien
          </h1>
          <p className="text-sm text-gray-500">
            Vamos a intentarlo de nuevo
          </p>

          <button
            onClick={handleRetry}
            className="mt-4 rounded-xl bg-gray-900 px-5 py-2 text-white"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (showFutureScreen) {
    return (
      <>
        <FutureMovementsScreen
          futureMovements={futureMovements}
          onAdd={handleOpenAddFuture}
          onEdit={handleEditFuture}
          onDelete={handleDeleteFuture}
          onBack={() => setShowFutureScreen(false)}
        />

        <FutureMovementModal
          isOpen={futureModalOpen}
          editingItem={editingFutureMovement}
          onClose={handleCloseFutureModal}
          onSave={handleSaveFuture}
        />
      </>
    )
  }

  return (
    <>
      <div className="mx-auto min-h-screen max-w-md space-y-6 bg-[#FAFAF9] px-5 py-8">
        {feedback ? (
          <div className="rounded-xl bg-gray-900 px-4 py-3 text-sm text-white">
            {feedback}
          </div>
        ) : null}

        <div>
          <h1 className="text-4xl font-semibold text-gray-900">
            ${money.toLocaleString("es-CL")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Hoy tienes disponible
          </p>
        </div>

        {isOnboarding ? (
          <div className="space-y-2">
            <p className="text-gray-700">
              Empecemos a ordenar tu dinero
            </p>

            <p className="text-sm text-gray-500">
              Llevas {onboardingCount} de 3 movimientos
            </p>

            <p className="text-sm text-gray-600">
              Agrega {3 - onboardingCount} más para ver tu proyección
            </p>
          </div>
        ) : (
          <>
            <div className="text-gray-700">
              Fin de mes:{" "}
              <span
                className={`font-medium ${
                  isCritical ? "text-red-500" : "text-yellow-500"
                }`}
              >
                ${projection.finalBalance.toLocaleString("es-CL")}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                {getInsight()}
              </p>

              <p className="text-sm text-gray-500">
                Puedes usar hasta ${safeToSpend.toLocaleString("es-CL")}
              </p>

              <p className="text-xs text-gray-400">
                Si gastas $50.000 → {simulateExpense(50000) ? "riesgo" : "ok"}
              </p>
            </div>
          </>
        )}

        <div className="flex gap-3">
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
        </div>

        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Mínimo seguro
          </p>

          <input
            type="number"
            value={safeMinimum}
            onChange={(e) => setSafeMinimum(Number(e.target.value) || 0)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none"
          />

          <p className="text-sm text-gray-500">
            Define tu mínimo para activar alertas
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              Próximos movimientos
            </p>
            <button
              onClick={() => setShowFutureScreen(true)}
              className="text-sm text-gray-500"
            >
              Editar
            </button>
          </div>

          {futureMovements.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aún no has planificado movimientos futuros
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Tienes {futureMovements.length} movimientos planificados
            </p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 text-sm">
          <p className="mb-2 text-gray-500">Hoy</p>

          {movements.map((movement) => (
            <div
              key={movement.id}
              className="flex justify-between border-b border-gray-100 py-2"
            >
              <span>{movement.label}</span>
              <span
                className={
                  movement.type === "income" ? "text-green-600" : "text-gray-800"
                }
              >
                {movement.type === "income" ? "+" : "-"}$
                {movement.amount.toLocaleString("es-CL")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AddMovementModal
        isOpen={modalType !== null}
        type={modalType}
        onClose={() => setModalType(null)}
        onSave={handleAddMovement}
      />

      <FutureMovementModal
        isOpen={futureModalOpen}
        editingItem={editingFutureMovement}
        onClose={handleCloseFutureModal}
        onSave={handleSaveFuture}
      />
    </>
  )
}
