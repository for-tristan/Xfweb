"use client"

import * as React from "react"

export type ToastVariant = "default" | "success" | "destructive"

export interface ToastData {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  duration?: number
}

const TOAST_LIMIT = 3
const DEFAULT_DURATION = 4000

type Action =
  | { type: "ADD_TOAST"; toast: ToastData }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

interface State {
  toasts: ToastData[]
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string, delay: number) => {
  if (toastTimeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, delay)
  toastTimeouts.set(toastId, timeout)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST": {
      const newToasts = [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      return { ...state, toasts: newToasts }
    }
    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) {
        addToRemoveQueue(toastId, 400)
      } else {
        state.toasts.forEach((t) => addToRemoveQueue(t.id, 400))
      }
      return state
    }
    case "REMOVE_TOAST": {
      if (action.toastId === undefined) return { ...state, toasts: [] }
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) }
    }
  }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

type ToastInput = Omit<ToastData, "id">

function toast(input: ToastInput | string) {
  const id = genId()
  const props: ToastData = typeof input === "string"
    ? { id, title: input }
    : { ...input, id }

  const duration = props.duration ?? DEFAULT_DURATION

  dispatch({ type: "ADD_TOAST", toast: props })
  addToRemoveQueue(id, duration)

  const dismiss = () => {
    dispatch({ type: "DISMISS_TOAST", toastId: id })
  }

  return { id, dismiss }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
