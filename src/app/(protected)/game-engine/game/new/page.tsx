// src/app/(protected)/game-engine/game/create/page.tsx
'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput } from '@/components/atoms/input/GenericInput'
import { GenericButton } from '@/components/atoms/buttons/GenericButton'
import { useToast } from '@/context/ToastContext'
import { PageSpinner } from '@/components/atoms/spinner/LogoSpinner'

import { GameConfig } from '@/app/generated/prisma'
import { Modal } from '@/components/molecules/modal/Modal'
import { GameConfigLine } from '@/components/molecules/games/GameConfigLine'


const CreateGamePage: React.FC = () => {
  const router = useRouter()
  const { addToast } = useToast()

  const [configs, setConfigs] = useState<GameConfig[]>([])
  const [loadingConfigs, setLoadingConfigs] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    configId: '',
    isPrivate: false,
    passcode: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Load configs
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/game-engine/config')
        const json = await res.json()
        const all = [
          ...json.default,
          ...json.owned,
          ...json.shared,
        ] as GameConfig[]
        setConfigs(all)
        if (all.length) 
          setForm(f => ({ ...f, configId: all[0].id }))
        
      } catch {
        addToast('Failed to load configs', 'error')
      } finally {
        setLoadingConfigs(false)
      }
    }
    load()
  }, [addToast])

  const handleChange = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/game-engine/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Create failed')
      addToast('Game created!', 'success')
      router.push(`/game-engine/game/${json.id}`)
    } catch (err: any) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingConfigs) return <PageSpinner />

  const selectedConfig = configs.find(c => c.id === form.configId)

  return (
    <>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-2xl text-white mb-4">Pick a Config</h2>
        <ul className="space-y-2 w-full h-full overflow-auto">
          {configs.map(cfg => (
            <GameConfigLine
              key={cfg.id}
              config={cfg}
              onClick={() => {
                handleChange('configId', cfg.id)
                setModalOpen(false)
              }}
            />
          ))}
        </ul>
      </Modal>

      <main className="p-8 max-w-lg mx-auto space-y-6">
        <h1 className="text-3xl font-semibold text-white">New Game</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-indigo-800 p-6 rounded">
          <TextInput
            label="Game Name"
            value={form.name}
            setValue={v => handleChange('name', v)}
            hint={!form.name ? 'Name is required' : undefined}
            hintColorClass="text-yellow-300"
          />

          <div>
            <p className="text-indigo-200 mb-1">Game Config</p>
            <GenericButton onClick={() => setModalOpen(true)}>
              {'Select Config…'}
            </GenericButton>
            {selectedConfig && <GameConfigLine config={selectedConfig} />}
          </div>

          <label className="flex items-center space-x-2 text-indigo-200">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={e => handleChange('isPrivate', e.target.checked)}
              className="accent-cyan-400"
            />
            <span>Private Game</span>
          </label>

          {form.isPrivate && (
            <TextInput
              label="Passcode"
              value={form.passcode}
              setValue={v => handleChange('passcode', v)}
              hint={!form.passcode ? 'Passcode required' : undefined}
              hintColorClass="text-yellow-300"
            />
          )}

          <GenericButton type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Game'}
          </GenericButton>
        </form>
      </main>
    </>
  )
}

export default CreateGamePage
