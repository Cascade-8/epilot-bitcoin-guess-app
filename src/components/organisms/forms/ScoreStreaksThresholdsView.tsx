'use client'
import React, { useMemo } from 'react'
import {
  parseFuncs,
  validateFuncSet,
  getPreviewData,
  getFunctionColors,
} from '@/lib/helpers/scoreStreaksHelper'
import ScoreStreaksChart from '@/components/molecules/charts/scoreStreaksChart/ScoreStreaksChart'

type Props = {
  thresholds: string
}

const ScoreStreakThresholdView: React.FC<Props> = ({ thresholds }) => {
  const value = (thresholds || '').trim()

  // same parsing/validation as input
  const { funcs, errors } = useMemo(() => parseFuncs(value), [value])
  const validateError = useMemo(
    () => (value ? validateFuncSet(funcs) : undefined),
    [funcs, value]
  )

  const previews = useMemo(() => {
    if (errors.length || validateError || !value) return null
    return getPreviewData(value)
  }, [value, errors, validateError])

  const hintText = useMemo(() => {
    const parts: string[] = []
    if (!value) parts.push('e.g. f(n:n+2);f(n:n*2:n>5);f(n:n*3:5<n<12)')
    if (errors.length) parts.push(...errors)
    if (validateError) parts.push(validateError)
    return parts.length ? parts.join('\n') : undefined
  }, [value, errors, validateError])

  const { colors, defaultIndex } = useMemo(
    () => getFunctionColors(value),
    [value]
  )

  return (
    <div>
      {/* Function Badges (read-only, same style as input) */}
      <div className="flex flex-wrap gap-2 mt-3">
        {value
          .split(';')
          .filter(v => v.trim().length)
          .map((fn, idx) => {
            const isDefault = idx === defaultIndex
            const bgColor = isDefault ? 'bg-orange-300 text-black' : ''
            const badgeColor = !isDefault ? { backgroundColor: colors[idx], color: '#000' } : undefined
            return (
              <span
                key={`${fn}-${idx}`}
                className={`px-2 py-1 rounded text-sm ${bgColor}`}
                style={badgeColor}
                title={fn}
              >
                {fn}
              </span>
            )
          })}
      </div>

      {/* Hint / tooltip (same content & tone as input) */}
      {hintText && (
        <div
          className={`mt-3 text-sm whitespace-pre-line rounded bg-indigo-900/40 px-3 py-2 ${
            errors.length || validateError ? 'text-red-300' : 'text-slate-300'
          }`}
        >
          {hintText}
        </div>
      )}

      {/* Previews + Chart (identical rendering) */}
      {previews && (() => {
        const { colors, defaultIndex } = getFunctionColors(value)
        return (
          <>
            {previews.map(({ label, pts }, rowIdx) => {
              const isDefault = rowIdx === defaultIndex
              const style = isDefault ? undefined : { color: colors[rowIdx] }
              const className = `text-sm mt-2 ${isDefault ? 'text-orange-300' : ''}`
              return (
                <div key={label} className={className} style={style}>
                  <strong>{label}:</strong>{' '}
                  {pts.length > 0 ? pts.map(({ n, v }) => `${n} → ${v}`).join(', ') : '—'}
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

export default ScoreStreakThresholdView
