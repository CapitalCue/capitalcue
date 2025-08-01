'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Toast {
  id: string
  title?: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

let toastQueue: Toast[] = []
let toastListeners: Array<(toasts: Toast[]) => void> = []

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast: Toast = { ...toast, id }
  
  toastQueue = [...toastQueue, newToast]
  toastListeners.forEach(listener => listener(toastQueue))
  
  // Auto remove after duration
  setTimeout(() => {
    removeToast(id)
  }, toast.duration || 5000)
}

const removeToast = (id: string) => {
  toastQueue = toastQueue.filter(toast => toast.id !== id)
  toastListeners.forEach(listener => listener(toastQueue))
}

export const toast = {
  success: (message: string, title?: string) => 
    addToast({ type: 'success', description: message, title }),
  error: (message: string, title?: string) => 
    addToast({ type: 'error', description: message, title }),
  warning: (message: string, title?: string) => 
    addToast({ type: 'warning', description: message, title }),
  info: (message: string, title?: string) => 
    addToast({ type: 'info', description: message, title }),
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setToasts(newToasts)
    toastListeners.push(listener)
    
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm p-4 rounded-lg shadow-lg border backdrop-blur-sm
            animate-in slide-in-from-top-2 fade-in-0 duration-300
            ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
            ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {toast.title && (
                <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
              )}
              {toast.description && (
                <p className="text-sm opacity-90">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}