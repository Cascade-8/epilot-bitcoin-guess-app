'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput, NumberInput } from '@/components/atoms/input/GenericInput'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import { ScoreStreakThresholdInput } from '@/components/molecules/ScoreStreakThresholdInput'
import { useToast } from '@/context/ToastContextProvider'

export default function NewConfigPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [form, setForm] = useState({
    name: '',
    guessingPeriod: 5000,
    scoreStreaksEnabled: false,
    scoreStreakThresholds: '',
    bettingMode: false,
    maxPlayers: 1,
    duration: 65000,
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = <K extends keyof typeof form>(
    key: K,
    value: typeof form[K]
  ) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/game-engine/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        const msg = json.error || 'Failed to create config'
        setError(msg)
        addToast(`Error: ${msg}`, 'error')
      } else {
        addToast('Config created successfully', 'success')
        router.push(`/game-engine/config/${json.id}`)
      }
    } catch (e: any) {
      const msg = e.message || 'Network error'
      setError(msg)
      addToast(`Error: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold text-white">New Game Config</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-indigo-800 p-6 rounded">
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
            onChange={e => handleChange('scoreStreaksEnabled', e.target.checked)}
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

        <GenericButton type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Create Config'}
        </GenericButton>
      </form>
    </main>
  )
}