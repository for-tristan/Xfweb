"use client"

import { useToast, type ToastVariant } from "@/hooks/use-toast"
import { useCallback, useEffect, useRef, useState } from "react"

// Icon + accent color per variant (iPhone-style)
const variantConfig: Record<string, { icon: string; color: string; bg: string }> = {
  default:     { icon: "fa-solid fa-circle-info",       color: "var(--accent)",       bg: "color-mix(in srgb, var(--accent) 12%, transparent)" },
  success:     { icon: "fa-solid fa-circle-check",      color: "var(--success-color, #22c55e)", bg: "color-mix(in srgb, var(--success-color, #22c55e) 12%, transparent)" },
  destructive: { icon: "fa-solid fa-circle-exclamation", color: "var(--error-color, #ef4444)",   bg: "color-mix(in srgb, var(--error-color, #ef4444) 12%, transparent)" },
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
  const touchStartY = useRef(0)
  const dismissed = useRef(false)

  // Trigger entrance transition after mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const doDismiss = useCallback(() => {
    if (dismissed.current) return
    dismissed.current = true
    setExiting(true)
    setTimeout(() => dismiss(id), 500) // wait for exit transition to finish
  }, [id, dismiss])

  // Auto-dismiss after ~4s
  useEffect(() => {
    const timer = setTimeout(() => {
      doDismiss()
    }, 3500)
    return () => clearTimeout(timer)
  }, [doDismiss])

  // Swipe-to-dismiss (iPhone-like)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) doDismiss()
    if (dy < -50 && Math.abs(dy) > Math.abs(dx)) doDismiss()
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
      <div className="xf-toast-app-icon">
        <span className="xf-toast-app-icon-inner">X</span>
      </div>
      <div className="xf-toast-body">
        <div className="xf-toast-header">
          <span className="xf-toast-app-name">X.Foundry</span>
          <span className="xf-toast-time">now</span>
        </div>
        {title && <div className="xf-toast-title">{title}</div>}
        {description && <div className="xf-toast-desc">{description}</div>}
      </div>
      <div className="xf-toast-variant-icon" style={{ background: v.bg }}>
        <i className={v.icon} style={{ color: v.color }} />
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
