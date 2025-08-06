'use client'

import React, { useState, FormEvent } from 'react'
import { TextInput, NumberInput } from '@/components/atoms/input/GenericInput'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import { ScoreStreakThresholdInput } from '@/components/organisms/forms/ScoreStreakThresholdInput'

export interface GameConfig {
  name: string
  guessingPeriod: number
  scoreStreaksEnabled: boolean
  scoreStreakThresholds: string
  bettingMode: boolean
  maxPlayers: number
  duration: number
}

interface GameConfigFormProps {
  initialData: GameConfig
  onSubmit: (data: GameConfig) => Promise<void>
  submitLabel?: string
}

export const GameConfigForm: React.FC<GameConfigFormProps> = ({
  initialData,
  onSubmit,
  submitLabel = 'Save Config',
}) => {
  const [form, setForm] = useState<GameConfig>(initialData)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = <K extends keyof GameConfig>(
    key: K,
    value: GameConfig[K]
  ) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: any) {
      setError(err.message || 'Error saving config')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-indigo-800 p-6 rounded"
    >
      <TextInput
        label="Config Name"
        value={form.name}
        setValue={v => handleChange('name', v)}
        hint={!form.name ? 'Name is required' : undefined}
        hintColorClass="text-yellow-300"
      />

      <NumberInput
        label="Guessing Period (ms)"
        value={String(form.guessingPeriod)}
        setValue={v => handleChange('guessingPeriod', Number(v))}
        min={5000}
        step={1000}
        hint={form.guessingPeriod < 5000 ? 'Must be ≥ 5000ms' : undefined}
        hintColorClass="text-yellow-300"
      />

      <label className="flex items-center space-x-2 text-indigo-200">
        <input
          type="checkbox"
          checked={form.scoreStreaksEnabled}
          onChange={e =>
            handleChange('scoreStreaksEnabled', e.target.checked)
          }
          className="accent-cyan-400"
        />
        <span>Enable Score Streaks</span>
      </label>

      {form.scoreStreaksEnabled && (
        <ScoreStreakThresholdInput
          value={form.scoreStreakThresholds}
          onChange={v => handleChange('scoreStreakThresholds', v)}
        />
      )}

      <label className="flex items-center space-x-2 text-indigo-200">
        <input
          type="checkbox"
          checked={form.bettingMode}
          onChange={e => handleChange('bettingMode', e.target.checked)}
          className="accent-cyan-400"
        />
        <span>Enable Betting Mode</span>
      </label>

      <NumberInput
        label="Max Players"
        value={String(form.maxPlayers)}
        setValue={v => handleChange('maxPlayers', Number(v))}
        min={0}
        step={1}
        hint="0 = infinite players"
        hintColorClass="text-slate-400"
      />

      <NumberInput
        label="Duration (ms)"
        value={String(form.duration)}
        setValue={v => handleChange('duration', Number(v))}
        min={0}
        step={1000}
        hint={
          form.duration !== 0
            ? form.duration < form.guessingPeriod + 60000
              ? 'Must be ≥ period + 60000ms'
              : undefined
            : '0 = infinite time'
        }
        hintColorClass="text-yellow-300"
      />

      {error && <p className="text-red-400">{error}</p>}

      <div className="w-32 mx-auto"><GenericButton type="submit" disabled={loading}>
        {loading ? 'Saving…' : submitLabel}
      </GenericButton></div>
    </form>
  )
}
