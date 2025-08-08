// src/components/atoms/input/GenericInput.tsx
'use client'

import React, {
  ReactNode,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

type BaseProps = {
  /** The field’s label (and initial placeholder) */
  label: string
  /** Controlled value */
  value: string
  /** Change handler */
  setValue: (value: string) => void
  /** Optional id; will generate one from the label if omitted */
  id?: string
  /** Optional hint text below the field */
  hint?: string
  /** Tailwind color class for the hint text */
  hintColorClass?: string
  children?: ReactNode
}

/**
 * GenericInput renders either an <input> or <textarea> with a floating label.
 */
type GenericInputProps<T extends 'input' | 'textarea'> = BaseProps & {
  as?: T
} & (T extends 'textarea'
  ? TextareaHTMLAttributes<HTMLTextAreaElement>
  : InputHTMLAttributes<HTMLInputElement>)

const GenericInput = <T extends 'input' | 'textarea' = 'input'>({
  as,
  label,
  value,
  setValue,
  id,
  hint,
  hintColorClass = 'text-red-500',
  ...rest
}: GenericInputProps<T>) => {
  const inputId =
    id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="relative w-full">
      {as === 'textarea' ? (
        <textarea
          id={inputId}
          className="peer w-full px-2 pt-6 pb-2 border-b border-b-indigo-600 bg-transparent focus:border-b-indigo-400 outline-none resize-y"
          placeholder=" "
          value={value}
          onChange={e => setValue(e.target.value)}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={inputId}
          className="peer w-full px-2 pt-6 pb-2 border-b border-b-indigo-600 bg-transparent focus:border-b-indigo-400 outline-none"
          placeholder=" "
          value={value}
          onChange={e => setValue(e.target.value)}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      <label
        htmlFor={inputId}
        className={`
          absolute left-2 origin-left text-indigo-400
          transition-all duration-200
          peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-indigo-400
          peer-focus:top-0 peer-focus:text-sm peer-focus:text-cyan-400
          ${value ? 'top-0 text-sm text-cyan-400' : 'top-1'}
        `}
      >
        {label}
      </label>

      {hint && (
        <p className={`mt-2 ml-2 text-xs ${hintColorClass} whitespace-pre-line`}>{hint}</p>
      )}
    </div>
  )
}

export const TextInput: React.FC<
  Omit<GenericInputProps<'input'>, 'as'>
> = props => <GenericInput as="input" type="text" {...props} />

export const NumberInput: React.FC<
  Omit<GenericInputProps<'input'>, 'as'>
> = props => <GenericInput as="input" type="number" {...props} />

export const DateInput: React.FC<
  Omit<GenericInputProps<'input'>, 'as'>
> = props => <GenericInput as="input" type="date" {...props} />

export const PasswordInput: React.FC<
  Omit<GenericInputProps<'input'>, 'as'>
> = props => <GenericInput as="input" type="password" {...props} />

export const TextAreaInput: React.FC<
  Omit<GenericInputProps<'textarea'>, 'as'>
> = props => <GenericInput as="textarea" rows={4} {...props} />

export default GenericInput
