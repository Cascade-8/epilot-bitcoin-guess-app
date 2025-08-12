export type FuncDef = { raw: string; expr: string; cond?: string }

const FUNC_PALETTE = [
  '#22d3ee', // cyan-400
  '#34d399', // emerald-400
  '#f472b6', // pink-400
  '#38bdf8', // sky-400
  '#a3e635', // lime-400
  '#2dd4bf', // teal-400
  '#fb7185', // rose-400
  '#f59e0b', // amber-500
]
const DEFAULT_ORANGE = '#fdba74'

export const getFunctionIndex = (thresholds: string, n: number): number => {
  const { funcs } = parseFuncs(thresholds)
  const ve = validateFuncSet(funcs)
  if (ve) throw new Error(ve)

  for (let i = 0; i < funcs.length; i++) {
    const f = funcs[i]
    if (!f.cond) continue
    // eslint-disable-next-line no-new-func
    const cf = new Function('n', `return ${normalizeCondition(f.cond)}`) as (n: number) => boolean
    if (cf(n)) return i
  }
  return funcs.findIndex(f => !f.cond) // default index
}

export const getFunctionColors = (
  thresholds: string
): { colors: string[]; defaultIndex: number } => {
  const { funcs } = parseFuncs(thresholds)
  const defaultIndex = Math.max(0, funcs.findIndex(f => !f.cond))
  let paletteIdx = 0
  const colors = funcs.map((f, i) => {
    if (i === defaultIndex) return DEFAULT_ORANGE
    const c = FUNC_PALETTE[paletteIdx % FUNC_PALETTE.length]
    paletteIdx++
    return c
  })
  return { colors, defaultIndex }
}


/** Normalize chained comparisons like 5<n<12 into (5<n)&&(n<12) form */
export const normalizeCondition = (cond: string): string => {
  let c = cond
  const rangeRe =
    /(-?\d+(?:\.\d+)?)\s*([<>]=?)\s*n\s*([<>]=?)\s*(-?\d+(?:\.\d+)?)/g
  c = c.replace(rangeRe, '($1 $2 n) && (n $3 $4)')
  return c.replace(/\s+/g, ' ').trim()
}

/** Parse "f(n:EXPR)" or "f(n:EXPR:COND)" items separated by ';' */
export const parseFuncs = (s: string): { funcs: FuncDef[]; errors: string[] } => {
  const funcs: FuncDef[] = []
  const errors: string[] = []

  const parts = s.split(';').map(p => p.trim()).filter(Boolean)
  for (const raw of parts) {
    const m = raw.match(/^f\(\s*n\s*[:;]\s*([^:()]+?)(?::([^()]+))?\s*\)$/)
    if (!m) {
      errors.push(`Invalid syntax: ${raw}`)
      continue
    }
    const expr = m[1]?.trim()
    const cond = m[2]?.trim()
    if (!expr) {
      errors.push(`Missing expression in: ${raw}`)
      continue
    }
    funcs.push({ raw, expr, cond })
  }

  return { funcs, errors }
}

/** Require exactly one default and no overlaps; returns error string if invalid */
export const validateFuncSet = (funcs: FuncDef[]): string | undefined => {
  if (funcs.filter(f => !f.cond).length !== 1)
    return 'Provide exactly one default (no condition)'

  const overlaps: Array<{ n: number; idxs: number[] }> = []
  const checks = funcs.map((f, i) => {
    if (!f.cond) return { idx: i, cf: null }
    try {
      // eslint-disable-next-line no-new-func
      const cf = new Function('n', `return ${normalizeCondition(f.cond!)}`) as (n: number) => boolean
      void cf(1)
      return { idx: i, cf }
    } catch {
      return { idx: i, cf: null }
    }
  })

  for (let n = 1; n <= 100; n++) {
    const hits: number[] = []
    for (const { idx, cf } of checks) {
      if (!cf) continue
      try {
        if (cf(n)) hits.push(idx)
      } catch {}
    }
    if (hits.length > 1) overlaps.push({ n, idxs: hits })
  }

  if (overlaps.length) {
    const snippets = overlaps.slice(0, 5).map(({ n, idxs }) => {
      const parts = idxs.map(i => `${i + 1} ${funcs[i].raw}`).join(', ')
      return `n=${n} ➝ ${parts}`
    })
    const more = overlaps.length > 5 ? `\n…and ${overlaps.length - 5} more` : ''
    return `Overlapping conditions detected:\n${snippets.join('\n')}${more}`
  }

  return undefined
}

/** Runtime calculation of score for a given n */
export const calculateScore = (thresholds: string, score: number): number => {
  const { funcs } = parseFuncs(thresholds)
  const ve = validateFuncSet(funcs)
  if (ve) throw new Error(ve)

  let value: number | undefined

  for (const f of funcs) {
    if (!f.cond) continue
    const cf = new Function('n', `return ${normalizeCondition(f.cond)}`) as (n: number) => boolean
    if (cf(score)) {
      const ef = new Function('n', `return ${f.expr}`) as (n: number) => number
      value = ef(score)
      break
    }
  }

  if (value === undefined) {
    const def = funcs.find(f => !f.cond)!
    const ef = new Function('n', `return ${def.expr}`) as (n: number) => number
    value = ef(score)
  }

  // Ensure integer result
  if (!Number.isFinite(value)) 
    throw new Error('Score expression returned a non-finite number')
  
  return Math.round(value)
}

/** Get preview data for thresholds */
export const getPreviewData = (
  thresholds: string
): { label: string; pts: { n: number; v: number }[] }[] => {
  const { funcs, errors } = parseFuncs(thresholds)
  const ve = validateFuncSet(funcs)

  // If parse/validate failed, don't attempt previewing
  if (errors.length || ve) return []

  // Build condition matches safely
  type CondInfo = { idx: number; matches: number[]; min: number }
  const conds: CondInfo[] = funcs
    .map((f, i) => {
      if (!f.cond) return null

      let cf: ((n: number) => boolean) | null = null
      try {
        // eslint-disable-next-line no-new-func
        cf = new Function(
          'n',
          `return ${normalizeCondition(f.cond!)}`
        ) as (n: number) => boolean
        // quick probe
        void cf(1)
      } catch {
        return null // skip invalid condition
      }

      // Enumerate matches 1..100
      const matches: number[] = []
      for (let n = 1; n <= 100; n++) 
        try {
          if (cf(n)) matches.push(n)
        } catch {
          // ignore runtime errors for weird user code
        }
      
      if (!matches.length) return null
      return { idx: i, matches, min: matches[0] }
    })
    .filter((x): x is CondInfo => !!x)
    .sort((a, b) => a.min - b.min)

  // Union coverage for default calculation
  const covered = new Array<boolean>(101).fill(false)
  for (const c of conds) for (const n of c.matches) covered[n] = true

  // Build preview rows; compute values via calculateScore
  return funcs.map((f, i) => {
    const label = f.cond ? `${i + 1} ${f.raw}` : `${i + 1} Default ${f.raw}`

    // Default row
    if (!f.cond) {
      const pts: { n: number; v: number }[] = []
      for (let n = 1; n <= 100 && pts.length < 5; n++) 
        if (!covered[n]) 
          try {
            pts.push({ n, v: calculateScore(thresholds, n) })
          } catch {
            // calculateScore can throw if thresholds invalid; just stop previews
            return { label, pts: [] }
          }
        
      
      return { label, pts }
    }

    // Conditional row
    const me = conds.find(c => c.idx === i)
    if (!me) return { label, pts: [] }

    const myPos = conds.findIndex(c => c.idx === i)
    const nextStricter = conds[myPos + 1]
    const hardStop = nextStricter ? nextStricter.min : Infinity

    // Numbers claimed by stricter conditions
    const stricter = new Set<number>()
    for (let k = myPos + 1; k < conds.length; k++) 
      for (const n of conds[k].matches) stricter.add(n)
    

    const pts: { n: number; v: number }[] = []
    for (const n of me.matches) {
      if (n >= hardStop) break
      if (stricter.has(n)) continue
      try {
        pts.push({ n, v: calculateScore(thresholds, n) })
      } catch {
        // If scoring fails for this n, skip it
        continue
      }
      if (pts.length >= 5) break
    }
    return { label, pts }
  })
}
