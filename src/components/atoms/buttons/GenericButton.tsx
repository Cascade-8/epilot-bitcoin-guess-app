import { ReactNode } from 'react'

type GenericButtonProps = {
  children?: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}

const GenericButton = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
}: GenericButtonProps) => {
  const baseStyle =
    'w-full text-sm h-full border-2 border-indigo-400 bg-indigo-600 text-gray-200 rounded-full cursor-pointer'
  const hoverStyle = 'hover:border-indigo-300 hover:bg-indigo-500'
  const disabledStyle =
    'disabled:cursor-not-allowed disabled:bg-slate-800 disabled:border-slate-900 disabled:hover:border-slate-900'
  const transitionStyle = 'transition-colors duration-200 ease-in-out'

  return (
    <button
      type={type}
      className={[
        baseStyle,
        hoverStyle,
        disabledStyle,
        transitionStyle,
      ].join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export { GenericButton }
