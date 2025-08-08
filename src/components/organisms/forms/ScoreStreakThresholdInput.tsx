'use client'
import React, { useMemo, useState } from 'react'
import GenericInput from '@/components/atoms/input/GenericInput'
import {
  getFunctionColors,
  getPreviewData,
  parseFuncs,
  validateFuncSet
} from '@/lib/helpers/scoreStreaksHelper'
import ScoreStreaksChart from '@/components/molecules/charts/scoreStreaksChart/ScoreStreaksChart'

type Props = {
  value: string
  onChange: (v: string) => void
}

export const ScoreStreakThresholdInput: React.FC<Props> = ({ value, onChange }) => {
  const { funcs, errors } = useMemo(() => parseFuncs(value.trim()), [value])
  const validateError = useMemo(() => (value ? validateFuncSet(funcs) : undefined), [funcs, value])

  const previews = useMemo(() => {
    if (errors.length || validateError || !value) return null
    return getPreviewData(value.trim())
  }, [value, errors, validateError])

  const hintText = useMemo(() => {
    const parts: string[] = []
    if (!value) parts.push('e.g. f(n:n+2);f(n:n*2:n>5);f(n:n*3:5<n<12)')
    if (errors.length) parts.push(...errors)
    if (validateError) parts.push(validateError)
    return parts.length ? parts.join('\n') : undefined
  }, [value, errors, validateError])

  const { colors, defaultIndex } = useMemo(
    () => getFunctionColors(value.trim()),
    [value]
  )

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [tempValue, setTempValue] = useState<string>('')

  const handleBadgeClick = (idx: number, current: string) => {
    setEditingIndex(idx)
    setTempValue(current)
  }

  const handleBadgeSave = () => {
    if (editingIndex === null) return
    const parts = value.split(';').map(v => v.trim())
    parts[editingIndex] = tempValue.trim()
    onChange(parts.join(';'))
    setEditingIndex(null)
    setTempValue('')
  }

  const handleBadgeCancel = () => {
    setEditingIndex(null)
    setTempValue('')
  }

  return (
    <div>
      <GenericInput
        label="Score Streak Thresholds"
        value={value}
        setValue={onChange}
        hint={hintText}
        hintColorClass={
          hintText && (errors.length || validateError ? 'text-red-400' : 'text-slate-400')
        }
      />

      {/* Function Badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        {value
          .split(';')
          .filter(v => v.trim().length)
          .map((fn, idx) => {
            const isDefault = idx === defaultIndex
            const bgColor = isDefault ? 'bg-orange-300 text-black' : ''
            const badgeColor = !isDefault ? { backgroundColor: colors[idx], color: '#000' } : undefined

            if (editingIndex === idx) 
              return (
                <div key={idx} className="flex items-center gap-1">
                  <input
                    type="text"
                    className="px-2 py-1 text-sm rounded bg-slate-800 border border-slate-500"
                    value={tempValue}
                    onChange={e => setTempValue(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="text-green-400 text-xs"
                    onClick={handleBadgeSave}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="text-red-400 text-xs"
                    onClick={handleBadgeCancel}
                  >
                    Cancel
                  </button>
                </div>
              )
            

            return (
              <span
                key={idx}
                className={`px-2 py-1 rounded cursor-pointer text-sm ${bgColor}`}
                style={badgeColor}
                onClick={() => handleBadgeClick(idx, fn)}
              >
                {fn}
              </span>
            )
          })}
      </div>

      {/* Previews + Chart */}
      {previews && (() => {
        const { colors, defaultIndex } = getFunctionColors(value.trim())
        return (
          <>
            {previews.map(({ label, pts }, rowIdx) => {
              const isDefault = rowIdx === defaultIndex
              const style = isDefault ? undefined : { color: colors[rowIdx] }
              const className = `text-sm mt-2 ${isDefault ? 'text-orange-300' : ''}`
              return (
                <div key={label} className={className} style={style}>
                  <strong>{label}:</strong>{' '}
                  {pts.length > 0
                    ? pts.map(({ n, v }) => `${n} → ${v}`).join(', ')
                    : '—'}
                </div>
              )
            })}
            <div className="my-3 h-[260px] w-full">
              <ScoreStreaksChart thresholds={value} nMax={50} />
            </div>
          </>
        )
      })()}
    </div>
  )
}

export default ScoreStreakThresholdInput
