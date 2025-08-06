// src/components/Modal.tsx
'use client'

import React, { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-indigo-900 rounded-lg max-w-6xl w-full h-full p-6 space-y-4">
          <button
            onClick={onClose}
            className="text-indigo-300 hover:text-white float-right"
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
