"use client"

import { useMemo, useState } from "react"

const FILTERS = [
  { id: "all", label: "Todo" },
  { id: "alert", label: "Alertas" },
  { id: "positive", label: "Positivo" },
]

function normalizeType(rawType) {
  if (rawType === "positive") return "positive"
  if (rawType === "alert" || rawType === "critical" || rawType === "preventive") {
    return "alert"
  }

  return "info"
}

function toDate(value) {
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getDayBucket(date) {
  if (!date) return "older"

  const now = new Date()
  const todayStart = startOfDay(now)
  const targetStart = startOfDay(date)
  const diffDays = Math.round((todayStart - targetStart) / 86400000)

  if (diffDays <= 0) return "today"
  if (diffDays === 1) return "yesterday"
  return "older"
}

function getDayLabel(bucket) {
  if (bucket === "today") return "HOY"
  if (bucket === "yesterday") return "AYER"
  return "ANTES"
}

function getRelativeTime(date) {
  if (!date) return ""

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))
  const bucket = getDayBucket(date)

  if (bucket === "today") {
    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`
    }

    const diffHours = Math.floor(diffMinutes / 60)
    return `Hace ${diffHours} hora${diffHours === 1 ? "" : "s"}`
  }

  if (bucket === "yesterday") {
    return "Ayer"
  }

  const diffDays = Math.max(2, Math.floor(diffMinutes / 1440))
  return `Hace ${diffDays} días`
}

function splitMessage(message) {
  const lines = String(message || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    title: lines[0] || "Hay una señal nueva",
    context: lines[1] || "",
  }
}

function getToneConfig(type) {
  if (type === "alert") {
    return {
      emoji: "⚠️",
      accentClass: "text-[#EF4444]",
      softClass: "bg-[#FEF2F2]",
    }
  }

  if (type === "positive") {
    return {
      emoji: "✔️",
      accentClass: "text-[#22C55E]",
      softClass: "bg-[#F0FDF4]",
    }
  }

  return {
    emoji: "👀",
    accentClass: "text-[#6B7280]",
    softClass: "bg-[#F5F5F4]",
  }
}

function normalizeNotification(rawNotification, index) {
  const type = normalizeType(rawNotification?.type)
  const message = String(rawNotification?.message || "").trim()
  const timestamp = String(rawNotification?.timestamp || "")
  const date = toDate(timestamp)

  if (!message) {
    return null
  }

  return {
    id: rawNotification?.id ?? `${type}-${timestamp || "no-date"}-${index}`,
    type,
    message,
    timestamp,
    date,
  }
}

function NotificationRow({ notification }) {
  const tone = getToneConfig(notification.type)
  const { title, context } = splitMessage(notification.message)

  return (
    <article className="flex items-start gap-3 py-3">
      <span className="pt-0.5 text-base leading-none">{tone.emoji}</span>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium leading-5 text-[#111827]">{title}</p>
        {context ? (
          <p className="text-sm leading-5 text-[#6B7280]">{context}</p>
        ) : null}
      </div>

      <time className="shrink-0 pt-0.5 text-xs text-[#6B7280]">
        {getRelativeTime(notification.date)}
      </time>
    </article>
  )
}

export default function NotificationsScreen({ notifications = [] }) {
  const [activeFilter, setActiveFilter] = useState("all")

  const normalizedNotifications = useMemo(() => {
    return notifications
      .map(normalizeNotification)
      .filter(Boolean)
      .sort((left, right) => {
        const leftTime = left.date ? left.date.getTime() : 0
        const rightTime = right.date ? right.date.getTime() : 0
        return rightTime - leftTime
      })
  }, [notifications])

  const visibleNotifications = useMemo(() => {
    if (activeFilter === "all") return normalizedNotifications
    return normalizedNotifications.filter((notification) => notification.type === activeFilter)
  }, [activeFilter, normalizedNotifications])

  const primaryNotification = visibleNotifications[0] || null
  const primaryContent = primaryNotification ? splitMessage(primaryNotification.message) : null
  const primaryTone = primaryNotification
    ? getToneConfig(primaryNotification.type)
    : getToneConfig("info")

  const groupedNotifications = useMemo(() => {
    return visibleNotifications.slice(1).reduce((groups, notification) => {
      const bucket = getDayBucket(notification.date)
      const existingGroup = groups.find((group) => group.bucket === bucket)

      if (existingGroup) {
        existingGroup.items.push(notification)
        return groups
      }

      groups.push({
        bucket,
        label: getDayLabel(bucket),
        items: [notification],
      })

      return groups
    }, [])
  }, [visibleNotifications])

  return (
    <main className="min-h-screen bg-[#FAFAF9] px-5 py-6">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-1">
          <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-[#111827]">
            Notificaciones
          </h1>
          <p className="text-sm leading-5 text-[#6B7280]">
            Señales claras para decidir mejor hoy.
          </p>
        </header>

        {normalizedNotifications.length > 0 ? (
          <nav className="flex gap-2">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[#111827] text-white"
                      : "bg-[#F1F1F0] text-[#6B7280]"
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </nav>
        ) : null}

        {primaryNotification ? (
          <section className="space-y-4 pb-6">
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-lg ${primaryTone.softClass}`}
              >
                {primaryTone.emoji}
              </span>

              <div className="min-w-0 space-y-2">
                <p className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#111827]">
                  {primaryContent?.title}
                </p>
                {primaryContent?.context ? (
                  <p className={`text-base leading-6 ${primaryTone.accentClass}`}>
                    {primaryContent.context}
                  </p>
                ) : null}
                <p className="text-sm text-[#6B7280]">
                  {getRelativeTime(primaryNotification.date)}
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-2 py-6">
            <p className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#111827]">
              Nada urgente por ahora
            </p>
            <p className="text-sm leading-5 text-[#6B7280]">
              Cuando algo importante cambie, lo verás aquí.
            </p>
          </section>
        )}

        {groupedNotifications.length > 0 ? (
          <section className="space-y-6">
            {groupedNotifications.map((group) => (
              <section key={group.bucket} className="space-y-2">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280]">
                  {group.label}
                </p>

                <div className="divide-y divide-[#EAE7E2]">
                  {group.items.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              </section>
            ))}
          </section>
        ) : normalizedNotifications.length > 1 ? null : normalizedNotifications.length > 0 ? (
          <section className="pt-2">
            <p className="text-sm text-[#6B7280]">
              No hay más señales importantes por ahora.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  )
}
