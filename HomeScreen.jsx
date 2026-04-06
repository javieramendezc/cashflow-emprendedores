"use client"
import { useEffect, useMemo, useState } from "react"
import AddMovementModal from "./AddMovementModal"
import FutureMovementModal from "./FutureMovementModal"

export default function HomeScreen() {
  const [error, setError] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [showFutureSection, setShowFutureSection] = useState(false)

  const [movements, setMovements] = useState([])
  const [safeMinimum, setSafeMinimum] = useState(200000)

  const [futureMovements, setFutureMovements] = useState([])
  const [futureModalOpen, setFutureModalOpen] = useState(false)
  const [editingFutureMovement, setEditingFutureMovement] = useState(null)

  // Cargar datos
  useEffect(() => {
    try {
      const storedMovements = localStorage.getItem("movements")
      const storedMinimum = localStorage.getItem("safeMinimum")
      const storedFutureMovements = localStorage.getItem("futureMovements")

      if (storedMovements) {
        setMovements(JSON.parse(storedMovements))
      }

      if (storedMinimum) {
        setSafeMinimum(Number(storedMinimum))
      }

      if (storedFutureMovements) {
        setFutureMovements(JSON.parse(storedFutureMovements))
      }
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }, [])

  // Guardar datos
  useEffect(() => {
    localStorage.setItem("movements", JSON.stringify(movements))
  }, [movements])

  useEffect(() => {
    localStorage.setItem("safeMinimum", String(safeMinimum))
  }, [safeMinimum])

  useEffect(() => {
    localStorage.setItem("futureMovements", JSON.stringify(futureMovements))
  }, [futureMovements])

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
    const sortedFuture = [...futureMovements].sort((a, b) => a.day - b.day)

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

  const isCritical = projection.finalBalance <= safeMinimum
  const safeToSpend = Math.max(projection.finalBalance - safeMinimum, 0)

  const nextFutureMovement = useMemo(() => {
    const today = new Date().getDate()
    return [...futureMovements]
      .filter((item) => item.day >= today)
      .sort((a, b) => a.day - b.day)[0]
  }, [futureMovements])

  function getInsight() {
    const today = new Date().getDate()

    if (projection.criticalDay) {
      const daysLeft = projection.criticalDay - today
      return `Ojo: en ${daysLeft} día${daysLeft === 1 ? "" : "s"} podrías quedar muy justa`
    }

    if (futureMovements.length === 0) {
      return "Todavía no has planificado lo que viene"
    }

    return `Puedes usar hasta $${safeToSpend.toLocaleString("es-CL")} sin desordenarte`
  }

  function handleAddMovement(newMovement) {
    try {
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
      setFeedback(`Ahora tienes $${nextMoney.toLocaleString("es-CL")}`)
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }

  function handleRetry() {
    setError(false)
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
      setFutureMovements((prev) => {
        const exists = prev.some((x) => x.id === item.id)
        if (exists) {
          return prev.map((x) => (x.id === item.id ? item : x))
        }
        return [item, ...prev]
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

  const sortedFutureMovements = [...futureMovements].sort((a, b) => a.day - b.day)

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-5 py-8 max-w-md mx-auto space-y-6">
      {feedback && (
        <div className="rounded-xl bg-gray-900 text-white text-sm px-4 py-3">
          {feedback}
        </div>
      )}

      <div>
        <h1 className="text-4xl font-semibold text-gray-900">
          ${money.toLocaleString("es-CL")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Hoy tienes disponible
        </p>
      </div>

      {isOnboarding ? (
        <div className="space-y-2">
          <p className="text-gray-700">¡Planifiquemos algo bueno!</p>

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
        </>
      )}

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
                  className="py-3 px-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      Día {item.day} · {item.type === "income" ? "Ingreso" : "Gasto"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-medium ${
                        item.type === "income" ? "text-green-600" : "text-gray-800"
                      }`}
                    >
                      {item.type === "income" ? "+" : "-"}$
                      {item.amount.toLocaleString("es-CL")}
                    </span>

                    <button
                      onClick={() => handleEditFuture(item)}
                      className="text-xs text-gray-500"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDeleteFuture(item.id)}
                      className="text-xs text-red-500"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
