"use client"

import { useSyncExternalStore } from "react"

const MOVEMENTS_KEY = "movements"
const SAFE_MINIMUM_KEY = "safeMinimum"
const FUTURE_MOVEMENTS_KEY = "futureMovements"
const NOTIFICATIONS_FEED_KEY = "notificationsFeed"
const NOTIFICATIONS_LAST_SEEN_KEY = "notificationsLastSeenAt"
const GLOBAL_STATE_EVENT = "cashflow:state-changed"

let cachedSnapshot = createEmptySnapshot()
let snapshotIsDirty = true

function createEmptySnapshot() {
  return {
    movements: [],
    safeMinimum: 200000,
    futureMovements: [],
    currentBalance: 0,
    projection: {
      finalBalance: 0,
      criticalDay: null,
    },
    notifications: [],
  }
}

function todayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeMovement(rawMovement) {
  const amount = Number(rawMovement?.amount)
  const label = String(rawMovement?.label || "").trim()
  const type = rawMovement?.type === "income" ? "income" : "expense"
  const dateValue = String(rawMovement?.date || "").trim()

  if (!label || !Number.isFinite(amount) || amount <= 0) {
    return null
  }

  return {
    id: rawMovement?.id ?? Date.now(),
    type,
    label,
    amount,
    date: /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : todayKey(),
    createdAt: String(rawMovement?.createdAt || new Date().toISOString()),
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

function normalizeNotification(rawNotification) {
  const id = String(rawNotification?.id || "")
  const type = rawNotification?.type === "positive"
    ? "positive"
    : rawNotification?.type === "alert"
      ? "alert"
      : "info"
  const message = String(rawNotification?.message || "").trim()
  const timestamp = String(rawNotification?.timestamp || "")

  if (!id || !message || !timestamp) {
    return null
  }

  return {
    id,
    type,
    message,
    timestamp,
  }
}

function readJson(key, fallback = []) {
  try {
    const rawValue = localStorage.getItem(key)
    if (!rawValue) return fallback
    return JSON.parse(rawValue)
  } catch {
    return fallback
  }
}

function sumAmounts(items) {
  return items.reduce((total, item) => total + item.amount, 0)
}

function calculateCurrentBalance(movements) {
  const currentDay = todayKey()

  return movements.reduce((total, movement) => {
    if (movement.date > currentDay) {
      return total
    }

    return total + (movement.type === "income" ? movement.amount : -movement.amount)
  }, 0)
}

function calculateProjection(currentBalance, futureMovements, safeMinimum) {
  const today = new Date().getDate()
  const sortedFuture = [...futureMovements].sort((left, right) => left.day - right.day)

  let runningBalance = currentBalance
  let criticalDay = null

  sortedFuture.forEach((item) => {
    if (item.day < today) return

    runningBalance += item.type === "income" ? item.amount : -item.amount

    if (runningBalance <= safeMinimum && criticalDay === null) {
      criticalDay = item.day
    }
  })

  return {
    finalBalance: runningBalance,
    criticalDay,
  }
}

function getHighExpenseThreshold(expenses, currentBalance, safeMinimum) {
  const averageExpense = expenses.length ? sumAmounts(expenses) / expenses.length : 0
  return Math.max(75000, averageExpense * 1.8, currentBalance * 0.18, safeMinimum * 0.2)
}

function getDaysSinceLastSeen(lastSeenAt) {
  if (!lastSeenAt) return null

  const lastDate = new Date(lastSeenAt)
  if (Number.isNaN(lastDate.getTime())) return null

  return Math.floor((Date.now() - lastDate.getTime()) / 86400000)
}

function buildNotificationCandidates({
  movements,
  safeMinimum,
  futureMovements,
  currentBalance,
  projection,
}) {
  const candidates = []
  const latestMovement = movements[0] || null
  const latestExpense = latestMovement?.type === "expense" ? latestMovement : null
  const expenses = movements.filter((movement) => movement.type === "expense")
  const expenseThreshold = getHighExpenseThreshold(expenses, currentBalance, safeMinimum)
  const safeFloor = safeMinimum || 200000

  if (latestExpense && latestExpense.amount >= expenseThreshold) {
    candidates.push({
      id: `high-expense-${latestExpense.id}`,
      type: "alert",
      message:
        projection.finalBalance <= safeFloor || projection.criticalDay !== null
          ? "Este gasto cambió tu semana\nOjo con los próximos días"
          : "Hoy vas bien, pero ojo con gastar de más\nAún puedes mantener el margen",
    })
  }

  if (projection.criticalDay !== null || projection.finalBalance <= safeFloor) {
    candidates.push({
      id: `critical-${projection.criticalDay ?? "month"}-${Math.round(projection.finalBalance / 10000)}`,
      type: "alert",
      message:
        projection.criticalDay !== null
          ? `Sigues justa esta semana\nDesde el día ${projection.criticalDay}, cuida gastos grandes`
          : "Tu margen baja esta semana\nEvita gastos grandes hoy",
    })
  } else if (movements.length >= 3 && projection.finalBalance > safeFloor * 1.2) {
    candidates.push({
      id: `positive-${Math.round(projection.finalBalance / 25000)}`,
      type: "positive",
      message:
        futureMovements.length > 0
          ? "Vas con buen margen\nPuedes gastar con tranquilidad hoy"
          : "Estás mejor que la semana pasada\nSigue así",
    })
  }

  if (movements.length > 0 && movements.length < 3) {
    const remaining = Math.max(1, 3 - movements.length)
    candidates.push({
      id: `onboarding-${movements.length}`,
      type: "info",
      message: `En ${remaining} movimientos vemos tu situación real\nTe falta poco`,
    })
  }

  return candidates
}

function mergeNotifications(existingNotifications, nextCandidates) {
  const knownIds = new Set(existingNotifications.map((notification) => notification.id))
  const nextEntries = nextCandidates
    .filter((candidate) => !knownIds.has(candidate.id))
    .map((candidate) => ({
      ...candidate,
      timestamp: new Date().toISOString(),
    }))

  return [...nextEntries, ...existingNotifications].slice(0, 30)
}

function buildSnapshotFromStorage() {
  if (typeof window === "undefined") {
    return createEmptySnapshot()
  }

  const movements = readJson(MOVEMENTS_KEY, [])
    .map(normalizeMovement)
    .filter(Boolean)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
  const futureMovements = readJson(FUTURE_MOVEMENTS_KEY, [])
    .map(normalizeFutureMovement)
    .filter(Boolean)
  const safeMinimum = Number(localStorage.getItem(SAFE_MINIMUM_KEY) || 200000) || 0
  const existingNotifications = readJson(NOTIFICATIONS_FEED_KEY, [])
    .map(normalizeNotification)
    .filter(Boolean)
  const currentBalance = calculateCurrentBalance(movements)
  const projection = calculateProjection(currentBalance, futureMovements, safeMinimum)
  const notificationCandidates = buildNotificationCandidates({
    movements,
    safeMinimum,
    futureMovements,
    currentBalance,
    projection,
  })
  let notifications = mergeNotifications(existingNotifications, notificationCandidates)

  const lastSeenAt = localStorage.getItem(NOTIFICATIONS_LAST_SEEN_KEY)
  const daysSinceLastSeen = getDaysSinceLastSeen(lastSeenAt)
  if (daysSinceLastSeen !== null && daysSinceLastSeen >= 1) {
    const inactivityId = `inactive-${todayKey()}`
    if (!notifications.some((notification) => notification.id === inactivityId)) {
      notifications = [
        {
          id: inactivityId,
          type: movements.length < 3 ? "info" : "alert",
          message:
            movements.length < 3
              ? "Llevas pocos movimientos\nVuelve y registra lo de hoy"
              : `Hace ${daysSinceLastSeen} día${daysSinceLastSeen === 1 ? "" : "s"} que no registras\nActualiza tu plata de hoy`,
          timestamp: new Date().toISOString(),
        },
        ...notifications,
      ].slice(0, 30)
    }
  }

  localStorage.setItem(NOTIFICATIONS_FEED_KEY, JSON.stringify(notifications))
  localStorage.setItem(NOTIFICATIONS_LAST_SEEN_KEY, new Date().toISOString())

  return {
    movements,
    safeMinimum,
    futureMovements,
    currentBalance,
    projection,
    notifications,
  }
}

function refreshSnapshot() {
  cachedSnapshot = buildSnapshotFromStorage()
  snapshotIsDirty = false
  return cachedSnapshot
}

function subscribe(listener) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleChange = () => {
    snapshotIsDirty = true
    refreshSnapshot()
    listener()
  }

  window.addEventListener("storage", handleChange)
  window.addEventListener(GLOBAL_STATE_EVENT, handleChange)

  return () => {
    window.removeEventListener("storage", handleChange)
    window.removeEventListener(GLOBAL_STATE_EVENT, handleChange)
  }
}

function getSnapshot() {
  if (typeof window !== "undefined" && snapshotIsDirty) {
    return refreshSnapshot()
  }

  return cachedSnapshot
}

function getServerSnapshot() {
  return createEmptySnapshot()
}

export function emitCashflowStateChange() {
  if (typeof window === "undefined") return

  snapshotIsDirty = true
  refreshSnapshot()
  window.dispatchEvent(new Event(GLOBAL_STATE_EVENT))
}

export function useCashflowGlobalState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
