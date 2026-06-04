"use client"

import { useToast, type ToastVariant } from "@/hooks/use-toast"
import { useCallback, useEffect, useRef, useState } from "react"

const variantConfig: Record<string, { icon: string; color: string }> = {
  default:     { icon: "fa-solid fa-circle-info",       color: "var(--accent)" },
  success:     { icon: "fa-solid fa-circle-check",      color: "var(--success-color, #22c55e)" },
  destructive: { icon: "fa-solid fa-circle-exclamation", color: "var(--error-color, #ef4444)" },
}

function ToastItem({
  id,
  title,
  description,
  variant = "default",
}: {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
}) {
  const [entered, setEntered] = useState(false)
  const [exiting, setExiting] = useState(false)
  const { dismiss } = useToast()
  const touchStartX = useRef(0)
  const dismissed = useRef(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const doDismiss = useCallback(() => {
    if (dismissed.current) return
    dismissed.current = true
    setExiting(true)
    setTimeout(() => dismiss(id), 400)
  }, [id, dismiss])

  useEffect(() => {
    const timer = setTimeout(() => doDismiss(), 3500)
    return () => clearTimeout(timer)
  }, [doDismiss])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 60) doDismiss()
  }

  const v = variantConfig[variant] || variantConfig.default

  return (
    <div
      className={`xf-toast${entered ? " xf-toast-enter" : ""}${exiting ? " xf-toast-exit" : ""}`}
      onClick={doDismiss}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="alert"
    >
      <i className={`xf-toast-icon ${v.icon}`} style={{ color: v.color }} />
      <div className="xf-toast-content">
        {title && <div className="xf-toast-title">{title}</div>}
        {description && <div className="xf-toast-desc">{description}</div>}
      </div>
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="xf-toast-container">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          id={t.id}
          title={t.title}
          description={t.description}
          variant={t.variant}
        />
      ))}
    </div>
  )
}
