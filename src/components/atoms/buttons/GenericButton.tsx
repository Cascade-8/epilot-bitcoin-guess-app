'use client'
import React, { ReactNode } from 'react'
type GenericButtonProps = {
  children?: ReactNode
  onClick?: (e?: any) => void
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}

/**
 * Generic Button element that is controlled from the outside
 * @param children optional children to display notifications etc
 * @param onClick onClick callback function to be executed on click
 * @param disabled sets the button disabled
 * @param type decides if it is a normal button or part of a form
 * @param className to override existing classNames use !<xyz> to mark them as important
 * @constructor
 */
const GenericButton: React.FC<GenericButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const baseStyle =
    'w-full text-base h-full border-2 border-indigo-400 bg-indigo-600 text-gray-200 rounded-full cursor-pointer relative'
  const hoverStyle = 'hover:border-indigo-300 hover:bg-indigo-500'
  const activeStyle = 'enabled:border-indigo-400 enabled:bg-indigo-600'
  const disabledStyle =
    'disabled:cursor-not-allowed disabled:bg-slate-800 disabled:border-slate-900 disabled:hover:border-slate-900'
  const transitionStyle = 'transition-colors duration-200 ease-in-out'

  return (
    <button
      type={type}
      className={[
        baseStyle,
        hoverStyle,
        activeStyle,
        disabledStyle,
        transitionStyle,
        className,         // <— your custom classes go last
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={e => {
        if (disabled) return
        onClick?.(e)
        // remove focus so hover/active styles don’t stick
        ;(e.currentTarget as HTMLButtonElement).blur()
      }}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export { GenericButton }
