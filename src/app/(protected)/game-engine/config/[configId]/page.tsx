'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GameConfigForm } from '@/components/organisms/forms/GameConfigForm'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import { useToast } from '@/context/ToastContext'
import { PageSpinner } from '@/components/atoms/spinner/LogoSpinner'
import { ScoreStreakThresholdView } from '@/components/organisms/forms/ScoreStreaksThresholdsView'
import { GameConfig } from '@/app/generated/prisma'

type LoadedResponse = Partial<GameConfig> & {
  id?: string
  canEdit?: boolean
  userId?: string | null
  currentUserId?: string | null
}

export default function ConfigPage() {
  const params = useParams() as { configId?: string | string[] }
  const configId = Array.isArray(params?.configId) ? params!.configId![0] : params?.configId
  const router = useRouter()
  const { addToast } = useToast()

  const [formData, setFormData] = useState<GameConfig | null>(null)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!configId) {
      setError('Missing config id')
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/game-engine/config/${configId}`)
        const json: LoadedResponse = await res.json()
        if (!res.ok) throw new Error((json as any)?.error || 'Failed to load config')

        if (cancelled) return
        setFormData({
          name: json.name ?? '',
          id: '',
          guessingPeriod: json.guessingPeriod ?? 10000,
          scoreStreaksEnabled: !!json.scoreStreaksEnabled,
          scoreStreakThresholds: json.scoreStreakThresholds ?? '',
          bettingMode: !!json.bettingMode,
          maxPlayers: json.maxPlayers ?? 0,
          duration: json.duration ?? 0,
          isPublic: false,
          userId: null
        })

        const inferred =
          typeof json.canEdit === 'boolean'
            ? json.canEdit
            : !!json.userId && !!json.currentUserId && json.userId === json.currentUserId
        setCanEdit(inferred)
        setMode('view')
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load config')
          addToast(`Error loading config: ${e.message || 'Unknown error'}`, 'error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true 
    }
  }, [configId, addToast])

  const handleSubmit = async (data: GameConfig) => {
    if (!canEdit) {
      addToast('You do not have permission to edit this config.', 'error')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/game-engine/config/${configId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')

      setFormData(data)
      setMode('view')
      addToast('Config saved', 'success')
    } catch (e: any) {
      setError(e.message || 'Failed to save')
      addToast(`Save failed: ${e.message || 'Unknown error'}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canEdit) {
      addToast('You do not have permission to delete this config.', 'error')
      return
    }
    if (!confirm('Are you sure you want to delete this config?')) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/game-engine/config/${configId}`, { method: 'DELETE' })
      const json = res.ok ? null : await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to delete')
      addToast('Config deleted', 'success')
      router.push('/game-engine/config')
    } catch (e: any) {
      setError(e.message || 'Failed to delete')
      addToast(`Delete failed: ${e.message || 'Unknown error'}`, 'error')
      setDeleting(false)
    }
  }

  if (loading) return <PageSpinner />
  if (error) return <p className="text-red-400">{error}</p>
  if (!formData) return null

  const title = mode === 'edit'
    ? `Edit Config${formData.name ? `: ${formData.name}` : ''}`
    : formData.name || 'Config'

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
      </div>

      {/* Content */}
      {mode === 'edit' ? (
        <>
          <GameConfigForm
            initialData={formData}
            onSubmit={handleSubmit}
            submitLabel={saving ? 'Saving…' : 'Save Changes'}
          />
          <div className="flex justify-center gap-4">
            {canEdit && (
              <div className="w-32">
                <GenericButton type="button" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </GenericButton>
              </div>
            )}
            <div className="w-32">
              <GenericButton type="button" onClick={() => setMode('view')}>
                Cancel
              </GenericButton>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-indigo-800 p-6 rounded space-y-6 text-indigo-100">
            <p><strong>Name:</strong> {formData.name || '—'}</p>
            <p><strong>Guessing Period:</strong> {formData.guessingPeriod} ms</p>
            <p>
              <strong>Score Streaks:</strong>{' '}
              {formData.scoreStreaksEnabled && (
                <div className="mt-3">
                  <ScoreStreakThresholdView
                    thresholds={formData.scoreStreakThresholds || ''}
                  />
                </div>
              )}
            </p>
            {/*<p><strong>Betting Mode:</strong> {formData.bettingMode ? 'Enabled' : 'Disabled'}</p>*/}
            <p><strong>Max Players:</strong> {formData.maxPlayers === 0 ? 'Infinite' : formData.maxPlayers}</p>
            <p><strong>Duration:</strong> {formData.duration === 0 ? 'Infinite' : `${formData.duration} ms`}</p>
          </div>

          <div className="flex justify-center gap-4">
            <div className="w-32">
              <GenericButton type="button" onClick={() => router.push('/game-engine/config')}>
                Back
              </GenericButton>
            </div>
            {canEdit && (
              <div className="w-32">
                <GenericButton type="button" onClick={() => setMode('edit')}>
                  Edit
                </GenericButton>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}
