"use client"
import { useEffect, useMemo, useState } from "react"
import AddMovementModal from "./AddMovementModal"
import FutureMovementModal from "./FutureMovementModal"
import FutureMovementItem from "./FutureMovementItem"

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
  const [isLoaded, setIsLoaded] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [showFutureSection, setShowFutureSection] = useState(false)
  const [simulationType, setSimulationType] = useState("expense")
  const [simulationAmount, setSimulationAmount] = useState("")

  const [movements, setMovements] = useState([])
  const [safeMinimum, setSafeMinimum] = useState(200000)

  const [futureMovements, setFutureMovements] = useState([])
  const [futureModalOpen, setFutureModalOpen] = useState(false)
  const [editingFutureMovement, setEditingFutureMovement] = useState(null)

  // Cargar datos
  useEffect(() => {
    loadStoredData()
  }, [])

  // Guardar datos
  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements))
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }, [isLoaded, movements])

  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(SAFE_MINIMUM_KEY, String(safeMinimum))
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }, [isLoaded, safeMinimum])

  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(FUTURE_MOVEMENTS_KEY, JSON.stringify(futureMovements))
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }, [futureMovements, isLoaded])

  // Feedback temporal
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(""), 2500)
    return () => clearTimeout(timer)
  }, [feedback])

  const money = useMemo(() => {
    return movements.reduce((acc, movement) => {
      return movement.type === "income"
        ? acc + movement.amount
        : acc - movement.amount
    }, 0)
  }, [movements])

  const onboardingCount = movements.length
  const isOnboarding = onboardingCount < 3

  const projection = useMemo(() => {
    const today = new Date().getDate()
    const sortedFuture = [...futureMovements]
      .map(normalizeFutureMovement)
      .filter(Boolean)
      .sort((a, b) => a.day - b.day)

    let runningBalance = money
    let criticalDay = null

    sortedFuture.forEach((item) => {
      if (item.day >= today) {
        runningBalance += item.type === "income" ? item.amount : -item.amount

        if (runningBalance <= safeMinimum && criticalDay === null) {
          criticalDay = item.day
        }
      }
    })

    return {
      finalBalance: runningBalance,
      criticalDay,
    }
  }, [money, futureMovements, safeMinimum])

  const isCritical =
    money <= safeMinimum ||
    projection.finalBalance <= safeMinimum ||
    projection.criticalDay !== null
  const safeToSpend = Math.max(projection.finalBalance - safeMinimum, 0)
  const simulationResult = useMemo(() => {
    const amount = Number(simulationAmount)

    if (!amount || amount <= 0) return null

    const adjustedBalance =
      simulationType === "income"
        ? projection.finalBalance + amount
        : projection.finalBalance - amount

    return {
      adjustedBalance,
      isCritical: adjustedBalance <= safeMinimum,
    }
  }, [simulationAmount, simulationType, projection.finalBalance, safeMinimum])

  const nextFutureMovement = useMemo(() => {
    const today = new Date().getDate()
    return [...futureMovements]
      .map(normalizeFutureMovement)
      .filter(Boolean)
      .filter((item) => item.day >= today)
      .sort((a, b) => a.day - b.day)[0]
  }, [futureMovements])

  function loadStoredData() {
    try {
      const storedMovements = localStorage.getItem(MOVEMENTS_KEY)
      const storedMinimum = localStorage.getItem(SAFE_MINIMUM_KEY)
      const storedFutureMovements = localStorage.getItem(FUTURE_MOVEMENTS_KEY)

      if (storedMovements) {
        const parsedMovements = JSON.parse(storedMovements)
        const normalizedMovements = Array.isArray(parsedMovements)
          ? parsedMovements.map(normalizeMovement).filter(Boolean)
          : []
        setMovements(normalizedMovements)
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
        const normalizedFutureMovements = Array.isArray(parsedFutureMovements)
          ? parsedFutureMovements.map(normalizeFutureMovement).filter(Boolean)
          : []
        setFutureMovements(normalizedFutureMovements)
      } else {
        setFutureMovements([])
      }

      setError(false)
    } catch (e) {
      console.error(e)
      setError(true)
    } finally {
      setIsLoaded(true)
    }
  }

  function getInsight() {
    const today = new Date().getDate()

    if (projection.criticalDay) {
      const daysLeft = projection.criticalDay - today
      if (daysLeft <= 0) {
        return "Ojo: hoy podrías tocar tu mínimo seguro"
      }

      if (daysLeft === 1) {
        return "Ojo: mañana podrías tocar tu mínimo seguro"
      }

      return `Ojo: en ${daysLeft} día${daysLeft === 1 ? "" : "s"} podrías quedar muy justa`
    }

    if (projection.finalBalance <= safeMinimum) {
      return "Vas muy ajustada para cerrar el mes con calma"
    }

    if (futureMovements.length === 0) {
      return "Todavía no has planificado lo que viene"
    }

    return `Puedes usar hasta $${safeToSpend.toLocaleString("es-CL")} sin desordenarte`
  }

  function getSimulationMessage() {
    if (!simulationResult) return "Prueba una decisión antes de hacerla"

    if (simulationResult.isCritical) {
      return "Si haces eso, quedarías en zona de riesgo"
    }

    return "Si haces eso, sigues bien"
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
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }

  function handleRetry() {
    loadStoredData()
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
    try {
      const normalizedItem = normalizeFutureMovement(item)

      if (!normalizedItem) {
        return
      }

      setFutureMovements((prev) => {
        const exists = prev.some((x) => x.id === normalizedItem.id)
        if (exists) {
          return prev.map((x) => (x.id === normalizedItem.id ? normalizedItem : x))
        }
        return [normalizedItem, ...prev]
      })

      setFutureModalOpen(false)
      setEditingFutureMovement(null)
      setFeedback("Próximo movimiento guardado")
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }

  function handleDeleteFuture(id) {
    try {
      setFutureMovements((prev) => prev.filter((item) => item.id !== id))
      setFeedback("Próximo movimiento eliminado")
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }

  const shellClassName = "min-h-screen bg-[#FAFAF9] px-5 py-8 max-w-md mx-auto space-y-6"
  const screenState = error ? "error" : isOnboarding ? "onboarding" : "normal"
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] px-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Algo no funcionó bien
          </h1>
          <p className="text-sm text-gray-500">
            Vamos a intentarlo de nuevo
          </p>

          <button
            onClick={handleRetry}
            className="mt-4 px-5 py-2 rounded-xl bg-gray-900 text-white"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return <div className={shellClassName} />
  }

  const sortedFutureMovements = [...futureMovements]
    .map(normalizeFutureMovement)
    .filter(Boolean)
    .sort((a, b) => a.day - b.day)

  const feedbackBlock = feedback ? (
    <div className="rounded-xl bg-gray-900 text-white text-sm px-4 py-3">
      {feedback}
    </div>
  ) : null

  const balanceBlock = (
    <div className="space-y-1">
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
        ${money.toLocaleString("es-CL")}
      </h1>
      <p className="text-sm text-gray-500">
        Hoy tienes disponible
      </p>
    </div>
  )

  const actionButtons = (
    <div className="flex gap-3">
      <button
        onClick={() => setModalType("income")}
        className="flex-1 py-2 rounded-xl bg-gray-900 text-white"
      >
        + Ingreso
      </button>

      <button
        onClick={() => setModalType("expense")}
        className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-800"
      >
        - Gasto
      </button>
    </div>
  )

  if (screenState === "onboarding") {
    return (
      <div className={shellClassName}>
        {feedbackBlock}
        {balanceBlock}

        <div className="space-y-2">
          <p className="text-gray-700">
            Ya partimos. Hagámoslo claro
          </p>

          <p className="text-sm text-gray-500">
            Llevas {onboardingCount} de 3 movimientos
          </p>

          <p className="text-sm text-gray-600">
            Agrega {3 - onboardingCount} más para ver tu proyección
          </p>
        </div>

        {actionButtons}

        <AddMovementModal
          isOpen={modalType !== null}
          type={modalType}
          onClose={() => setModalType(null)}
          onSave={handleAddMovement}
        />

        <FutureMovementModal
          isOpen={futureModalOpen}
          editingItem={editingFutureMovement}
          onClose={() => {
            setFutureModalOpen(false)
            setEditingFutureMovement(null)
          }}
          onSave={handleSaveFuture}
        />
      </div>
    )
  }

  return (
    <div className={shellClassName}>
      {feedbackBlock}
      {balanceBlock}

      <div className="space-y-1">
        <div className="text-gray-700">
          Fin de mes:{" "}
          <span className={`font-medium ${isCritical ? "text-red-500" : "text-yellow-500"}`}>
            ${projection.finalBalance.toLocaleString("es-CL")}
          </span>
        </div>

        <div className={`text-sm ${isCritical ? "text-red-600" : "text-gray-600"}`}>
          {getInsight()}
        </div>

        <div className="text-sm text-gray-500">
          Puedes usar hasta ${safeToSpend.toLocaleString("es-CL")} sin tocar tu mínimo seguro
        </div>
      </div>

      {actionButtons}

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

      <div className="rounded-3xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Próximos movimientos
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Lo que ya sabes que viene este mes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddFuture}
              className="text-sm text-gray-500"
            >
              + Agregar
            </button>

            <button
              onClick={() => setShowFutureSection((prev) => !prev)}
              className="text-sm text-gray-500"
            >
              {showFutureSection ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        {futureMovements.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no has planificado movimientos futuros
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Tienes {futureMovements.length} movimiento{futureMovements.length === 1 ? "" : "s"} planificado{futureMovements.length === 1 ? "" : "s"}
            </p>

            {nextFutureMovement ? (
              <p className="text-sm text-gray-500">
                Próximo: {nextFutureMovement.label} · día {nextFutureMovement.day}
              </p>
            ) : null}
          </>
        )}
      </div>

      {showFutureSection && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Lo que viene
            </p>
          </div>

          {sortedFutureMovements.length === 0 ? (
            <div className="text-sm text-gray-500 rounded-2xl border border-dashed border-gray-200 p-4">
              Todavía no hay ingresos o gastos futuros para proyectar.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
              {sortedFutureMovements.map((item) => (
                <div
                  key={item.id}
                  className="px-4"
                >
                  <FutureMovementItem
                    item={item}
                    onEdit={handleEditFuture}
                    onDelete={handleDeleteFuture}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-gray-200 bg-white p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Simular una decisión
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Mira qué pasa antes de gastar o contar con un ingreso
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSimulationType("expense")}
            className={`flex-1 py-2 rounded-xl border text-sm ${
              simulationType === "expense"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Gasto
          </button>

          <button
            type="button"
            onClick={() => setSimulationType("income")}
            className={`flex-1 py-2 rounded-xl border text-sm ${
              simulationType === "income"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Ingreso
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">
            Monto a simular
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={simulationAmount}
            onChange={(e) => setSimulationAmount(e.target.value)}
            placeholder="Ej. 80000"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[10000, 30000, 50000, 100000].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSimulationAmount(String(value))}
              className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs"
            >
              ${value.toLocaleString("es-CL")}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-2">
          <p
            className={`text-sm font-medium ${
              simulationResult?.isCritical ? "text-red-600" : "text-gray-900"
            }`}
          >
            {getSimulationMessage()}
          </p>

          <p className="text-sm text-gray-500">
            {simulationResult
              ? `Tu cierre proyectado quedaría en $${simulationResult.adjustedBalance.toLocaleString("es-CL")}`
              : "Ingresa un monto para ver el resultado"}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 text-sm">
        <p className="text-gray-500 mb-2">Hoy</p>

        {movements.map((m) => (
          <div
            key={m.id}
            className="flex justify-between py-2 border-b border-gray-100"
          >
            <span>{m.label}</span>
            <span className={m.type === "income" ? "text-green-600" : "text-gray-800"}>
              {m.type === "income" ? "+" : "-"}$
              {m.amount.toLocaleString("es-CL")}
            </span>
          </div>
        ))}
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
        onClose={() => {
          setFutureModalOpen(false)
          setEditingFutureMovement(null)
        }}
        onSave={handleSaveFuture}
      />
    </div>
  )
}
