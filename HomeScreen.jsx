"use client"
import { useMemo, useState, useEffect } from "react"
import AddMovementModal from "./AddMovementModal"

export default function HomeScreen() {
  const [error, setError] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [feedback, setFeedback] = useState("")

  const [movements, setMovements] = useState([])
  const [futureMovements, setFutureMovements] = useState([
    // ejemplo:
    // { type: "expense", amount: 20000, day: 15 },
  ])
  const [safeMinimum, setSafeMinimum] = useState(200000)

  // 🔵 CARGAR DATOS AL INICIAR
  useEffect(() => {
    try {
      const storedMovements = localStorage.getItem("movements")
      const storedFutureMovements = localStorage.getItem("futureMovements")
      const storedMinimum = localStorage.getItem("safeMinimum")

      if (storedMovements) {
        setMovements(JSON.parse(storedMovements))
      }

      if (storedFutureMovements) {
        setFutureMovements(JSON.parse(storedFutureMovements))
      }

      if (storedMinimum) {
        setSafeMinimum(Number(storedMinimum))
      }
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }, [])

  // 🟢 GUARDAR MOVIMIENTOS
  useEffect(() => {
    localStorage.setItem("movements", JSON.stringify(movements))
  }, [movements])

  // 🟣 GUARDAR MOVIMIENTOS FUTUROS
  useEffect(() => {
    localStorage.setItem("futureMovements", JSON.stringify(futureMovements))
  }, [futureMovements])

  // 🟡 GUARDAR MÍNIMO
  useEffect(() => {
    localStorage.setItem("safeMinimum", safeMinimum)
  }, [safeMinimum])

  // 💰 CÁLCULO REAL
  const money = useMemo(() => {
    return movements.reduce((acc, movement) => {
      return movement.type === "income"
        ? acc + movement.amount
        : acc - movement.amount
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
      const day = Number(movement.day)

      if (!day || day < currentDay || day > lastDayOfMonth) {
        return acc
      }

      if (!acc[day]) {
        acc[day] = []
      }

      acc[day].push(movement)
      return acc
    }, {})

    for (let day = currentDay; day <= lastDayOfMonth; day++) {
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
  }, [futureMovements, money])

  const onboardingCount = movements.length
  const isOnboarding = onboardingCount < 3
  const isCritical = money <= safeMinimum || projection.finalBalance <= safeMinimum

  // 🔁 FEEDBACK
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(""), 2500)
    return () => clearTimeout(timer)
  }, [feedback])

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

  // 🔴 ERROR
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

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-5 py-8 max-w-md mx-auto space-y-6">

      {/* 🔔 FEEDBACK */}
      {feedback && (
        <div className="rounded-xl bg-gray-900 text-white text-sm px-4 py-3">
          {feedback}
        </div>
      )}

      {/* 💰 DINERO */}
      <div>
        <h1 className="text-4xl font-semibold text-gray-900">
          ${money.toLocaleString("es-CL")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Hoy tienes disponible
        </p>
      </div>

      {/* 🟡 ONBOARDING */}
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
          {/* 📉 PROYECCIÓN SIMULADA */}
          <div className="text-gray-700">
            Fin de mes:{" "}
            <span className={`font-medium ${isCritical ? "text-red-500" : "text-yellow-500"}`}>
              ${projection.finalBalance.toLocaleString("es-CL")}
            </span>
          </div>

          {/* ⚠️ ALERTA */}
          <div className={`text-sm ${isCritical ? "text-red-600" : "text-gray-600"}`}>
            {isCritical
              ? projection.criticalDay
                ? `Ojo: el día ${projection.criticalDay} podrías quedar bajo tu mínimo seguro`
                : "Ojo: te estás quedando sin caja para cerrar el mes con calma"
              : "Puedes gastar hasta $5.000 esta semana"}
          </div>
        </>
      )}

      {/* 🔘 BOTONES */}
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

      {/* 🧩 MÍNIMO SEGURO */}
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

      {/* 📋 LISTA */}
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
    </div>
  )
}
