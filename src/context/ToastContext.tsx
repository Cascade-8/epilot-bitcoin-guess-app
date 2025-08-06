'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle,
  faInfoCircle,
  faExclamationTriangle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons'


interface Toast {
  id: number
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  exiting?: boolean
}

type ToastContextType = {
  addToast: (message: string, type?: Toast['type']) => void
}


const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * Handle toast notifications across pages
 */
const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random()
    const newToast: Toast = { id, message, type, exiting: false }
    setToasts(prev => [...prev, newToast])

    // Stage exit animation after 5s
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
      // Remove after exit animation (0.3s)
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 300)
    }, 5000)
  }, [])

  // Helper for styles/icon
  const getToastConfig = (type: Toast['type'] = 'info') => {
    switch (type) {
    case 'success':
      return { bg: 'bg-green-300', text: 'text-green-500', icon: faCheckCircle }
    case 'error':
      return { bg: 'bg-red-300', text: 'text-red-500', icon: faTimesCircle }
    case 'warning':
      return { bg: 'bg-orange-300', text: 'text-orange-500', icon: faExclamationTriangle }
    case 'info':
    default:
      return { bg: 'bg-blue-300', text: 'text-blue-500', icon: faInfoCircle }
    }
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 inset-x-0 px-4 flex flex-col items-center space-y-2 z-50">
        {toasts.map(t => {
          const { bg, text, icon } = getToastConfig(t.type)
          return (
            <div
              key={t.id}
              className={
                `w-full sm:w-72 ${bg} px-4 py-2 rounded shadow-lg flex items-center space-x-2 ${t.exiting ? 'toast-exit' : 'toast-enter'}`
              }
            >
              <FontAwesomeIcon icon={icon} className={`${text} flex-shrink-0`} />
              <span className={`${text} font-medium`}>{t.message}</span>
            </div>
          )
        })}
      </div>

      {/* Toast animations */}
      <style jsx>{`
          @keyframes enter {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
          }
          @keyframes exit {
              from { opacity: 1; transform: translateY(0); }
              to { opacity: 0; transform: translateY(20px); height: 0; margin: 0; padding-top: 0; padding-bottom: 0; }
          }
          .toast-enter {
              opacity: 0;
              animation: enter 0.3s ease-out forwards;
          }
          .toast-exit {
              animation: exit 0.3s ease-in forwards;
          }
      `}</style>
    </ToastContext.Provider>
  )
}

// Hook
const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) 
    throw new Error('useToast must be used within ToastProvider')
  
  return context
}

export { ToastProvider, useToast }