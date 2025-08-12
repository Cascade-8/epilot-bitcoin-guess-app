'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GameConfigForm } from '@/components/organisms/forms/GameConfigForm'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import { useToast } from '@/context/ToastContext'
import { GameConfig } from '@/app/generated/prisma'

const DEFAULT_CONFIG: GameConfig = {
  name: '',
  guessingPeriod: 10000,
  scoreStreaksEnabled: false,
  scoreStreakThresholds: '',
  bettingMode: false,
  maxPlayers: 0,
  duration: 0,
  id: '',
  isPublic: null,
  userId: null
}

export default function NewConfigPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [formData] = useState<GameConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: GameConfig) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/game-engine/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create config')

      addToast('Config created', 'success')

      // Redirect to the new config page if the API returns an id
      const newId = json.id || json._id || json.configId
      if (newId) router.replace(`/game-engine/config/${newId}`)
      else router.push('/game-engine/config')
    } catch (e: any) {
      setError(e.message || 'Failed to save')
      addToast(`Save failed: ${e.message || 'Unknown error'}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold text-white">New Config</h1>

      <GameConfigForm
        initialData={formData}
        onSubmit={handleSubmit}
        submitLabel={saving ? 'Creating…' : 'Create Config'}
      />

      {error && <p className="text-red-400">{error}</p>}

      <div className="flex justify-center gap-4">
        <div className="w-32">
          <GenericButton type="button" onClick={() => router.push('/game-engine/config')}>
            Cancel
          </GenericButton>
        </div>
      </div>
    </main>
  )
}
