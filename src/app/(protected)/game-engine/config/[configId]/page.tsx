'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GameConfigForm, GameConfig } from '@/components/organisms/forms/GameConfigForm'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import { useToast } from '@/context/ToastContext'
import { PageSpinner } from '@/components/atoms/spinner/LogoSpinner'

export default function ConfigPage() {
  const { configId } = useParams() as { configId: string }
  const router = useRouter()
  const { addToast } = useToast()

  const [config, setConfig] = useState<GameConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setError(null)
      try {
        const res = await fetch(`/api/game-engine/config/${configId}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load config')
        setConfig({
          name: json.name,
          guessingPeriod: json.guessingPeriod,
          scoreStreaksEnabled: json.scoreStreaksEnabled,
          scoreStreakThresholds: json.scoreStreakThresholds,
          bettingMode: json.bettingMode,
          maxPlayers: json.maxPlayers,
          duration: json.duration,
        })
      } catch (err: any) {
        setError(err.message)
        addToast(`Error loading config: ${err.message}`, 'error')
      } finally {
        setLoading(false)
      }
    }
    load().then()
  }, [configId, addToast])

  const handleSave = async (data: GameConfig) => {
    setError(null)
    try {
      const res = await fetch(`/api/game-engine/config/${configId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      setConfig(data)
      setEditing(false)
      addToast('Config saved successfully', 'success')
    } catch (err: any) {
      setError(err.message)
      addToast(`Save failed: ${err.message}`, 'error')
      throw err
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this config?')) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/game-engine/config/${configId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to delete')
      }
      addToast('Config deleted', 'success')
      router.push('/game-engine/config')
    } catch (err: any) {
      setError(err.message)
      addToast(`Delete failed: ${err.message}`, 'error')
      setDeleting(false)
    }
  }

  if (loading) return <PageSpinner/>
  if (error) return <p className="text-red-400">{error}</p>
  if (!config) return null

  return (
    <main className="p-8 max-w-xl mx-auto space-y-6">
      {editing ? (
        <>
          <h1 className="text-3xl font-semibold text-white">Edit Config</h1>
          <GameConfigForm
            initialData={config}
            onSubmit={handleSave}
            submitLabel="Save Changes"
          />
          <div className="flex justify-center space-x-4">
            <div className="w-32">
              <GenericButton type="button" onClick={() => setEditing(false)}>
                Cancel
              </GenericButton>
            </div>
            <div className="w-32">
              <GenericButton
                type="button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </GenericButton>
            </div>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold text-white">{config.name}</h1>
          <div className="bg-indigo-800 p-6 rounded space-y-2 text-indigo-100">
            <p>
              <strong>Guessing Period:</strong> {config.guessingPeriod} ms
            </p>
            <p>
              <strong>Score Streaks:</strong>{' '}
              {config.scoreStreaksEnabled
                ? `Enabled (thresholds: ${config.scoreStreakThresholds})`
                : 'Disabled'}
            </p>
            <p>
              <strong>Betting Mode:</strong>{' '}
              {config.bettingMode ? 'Enabled' : 'Disabled'}
            </p>
            <p>
              <strong>Max Players:</strong>{' '}
              {config.maxPlayers === 0 ? 'Infinite' : config.maxPlayers}
            </p>
            <p>
              <strong>Duration:</strong>{' '}
              {config.duration === 0
                ? 'Infinite'
                : `${config.duration} ms`}
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <div className="w-32">
              <GenericButton onClick={() => setEditing(true)}>
                Edit
              </GenericButton>
            </div>
            <div className="w-32">
              <GenericButton
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </GenericButton>
            </div>
          </div>
        </>
      )}
    </main>
  )
}