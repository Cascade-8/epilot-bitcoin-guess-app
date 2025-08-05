// src/components/molecules/ScoreStreakThresholdInput.tsx
'use client'

import React, { useMemo } from 'react'
import GenericInput from '@/components/atoms/input/GenericInput'

type FuncDef = { raw: string; expr: string; cond?: string }
type PreviewPoint = { n: number; v: number }

const parseFuncs = (s: string): FuncDef[] =>
  s
    .split(';')
    .map(p => p.trim())
    .filter(Boolean)
    .map(raw => {
      const m = raw.match(
        /^f\(\s*n\s*[:;]\s*([0-9n+\-*/\s()]+)(?::([^()]+))?\s*\)$/
      )
      if (!m) throw new Error(`Invalid syntax: ${raw}`)
      return { raw, expr: m[1].trim(), cond: m[2]?.trim() }
    })

const validateFuncSet = (funcs: FuncDef[]): string | undefined => {
  if (funcs.filter(f => !f.cond).length !== 1) 
    return 'Provide exactly one default (no condition)'
  
  const assigned = new Set<number>()
  for (const f of funcs) {
    if (!f.cond) continue
    const cf = new Function('n', `return ${f.cond}`) as (n: number) => boolean
    for (let n = 1; n <= 100; n++) 
      if (cf(n)) {
        if (assigned.has(n)) 
          return `n=${n} matches multiple conditions`
        
        assigned.add(n)
      }
    
  }
  return undefined
}

type Props = {
  value: string
  onChange: (v: string) => void
}

export const ScoreStreakThresholdInput: React.FC<Props> = ({
  value,
  onChange,
}) => {
  const { error, funcs } = useMemo(() => {
    const s = value.trim()
    if (!s) return { error: undefined as undefined, funcs: [] as FuncDef[] }
    try {
      const fdefs = parseFuncs(s)
      const ve = validateFuncSet(fdefs)
      return { error: ve, funcs: fdefs }
    } catch (e: any) {
      return { error: e.message, funcs: [] as FuncDef[] }
    }
  }, [value])

  const fns = useMemo(
    () =>
      funcs.map(f =>
        // eslint-disable-next-line no-new-func
        new Function('n', `return ${f.expr}`) as (n: number) => number
      ),
    [funcs]
  )

  const previews = useMemo<
    { label: string; pts: PreviewPoint[] }[] | null
  >(() => {
    if (error || funcs.length === 0) return null

    // Build condition ranges [min, max] for each conditional
    const condRanges = funcs
      .map((f, i) => {
        if (!f.cond) return null
        const cf = new Function('n', `return ${f.cond}`) as (n: number) => boolean
        const matches: number[] = []
        for (let n = 1; n <= 100; n++) 
          if (cf(n)) matches.push(n)
        
        if (matches.length === 0) return null
        return { idx: i, min: Math.min(...matches), max: Math.max(...matches) }
      })
      .filter((x): x is { idx: number; min: number; max: number } => !!x)
      .sort((a, b) => a.min - b.min)

    return funcs.map((f, i) => {
      const pts: PreviewPoint[] = []
      if (f.cond) {
        // For conditional: take up to 5 values from its [min..max]
        const range = condRanges.find(r => r.idx === i)!
        let count = 0
        for (let n = range.min; n <= range.max && count < 5; n++) {
          pts.push({ n, v: fns[i](n) })
          count++
        }
      } else {
        // Default: values between first and second condition ranges
        const first = condRanges[0]
        const second = condRanges[1]
        const start = first.max + 1
        const end = second ? second.min - 1 : start + 4
        for (let n = start; n <= end; n++) 
          pts.push({ n, v: fns[i](n) })
        
      }
      const label = f.cond ? f.raw : `Default ${f.raw}`
      return { label, pts }
    })
  }, [funcs, fns, error])

  return (
    <div>
      <GenericInput
        label="Score Streak Thresholds"
        value={value}
        setValue={onChange}
        hint={
          !value
            ? 'e.g. f(n:n+2:n<5);f(n:n+3:n>7);f(n:n*2)'
            : error
              ? error
              : undefined
        }
        hintColorClass={
          !value
            ? 'text-slate-400'
            : error
              ? 'text-red-400'
              : 'text-slate-400'
        }
      />

      {previews &&
        previews.map(({ label, pts }) => (
          <div key={label} className="text-indigo-300 text-sm mt-2">
            <strong>{label}:</strong>{' '}
            {pts.map(({ n, v }) => `${n} → ${v}`).join(', ')}
          </div>
        ))}
    </div>
  )
}

export default ScoreStreakThresholdInput
