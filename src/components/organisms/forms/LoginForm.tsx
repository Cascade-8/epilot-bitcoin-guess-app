'use client'
import { useState, FormEvent, ReactNode } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TextInput } from '@/components/atoms/input/GenericInput'

type LoginFormProps = {
  children?: ReactNode
}

const LoginForm = ({ children }: LoginFormProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = await signIn('credentials', {
      redirect: false,
      username: form.username,
      password: form.password,
    })
    if (res?.error)
      setError(res.error)
    else
      router.push('/game-engine/game')

  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Signup failed')
      return
    }

    // At this point user is created — now log them in:
    const signInResult = await signIn('credentials', {
      redirect: false,
      username: form.username,
      password: form.password,
    })

    if (signInResult?.error)
      setError(signInResult.error)
    else
      router.push('/game-engine/game')   // or router.push('/') to go to your dashboard

  }

  return (
    <main className="w-screen h-screen bg-indigo-900 flex items-center justify-center">
      <div className="bg-indigo-800/50 backdrop-blur-lg rounded-2xl p-8 w-full max-w-sm">
        <div className="flex mb-6 text-indigo-300">
          {(['login', 'signup'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setMode(tab)
                setError(null)
              }}
              className={`flex-1 py-2 font-semibold transition ${
                mode === tab
                  ? 'border-b-2 border-cyan-400 text-white'
                  : 'hover:text-white/80'
              }`}
            >
              {tab === 'login' ? 'Login' : 'Sign Up'}
            </button>
          ))}
        </div>
        <form
          onSubmit={mode === 'login' ? handleLogin : handleSignup}
          className="space-y-4"
        >
          <TextInput
            label="Username"
            value={form.username}
            setValue={(v:string) =>
              setForm((f) => ({
                ...f,
                username: v,
              }))
            }
          />
          <TextInput
            label="Password"
            value={form.password}
            type={'password'}
            setValue={(v:string) =>
              setForm((f) => ({
                ...f,
                password: v,
              }))
            }
            id="password"
          />
          {error && <p className="text-yellow-300 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 bg-cyan-400 text-indigo-900 font-semibold rounded hover:bg-cyan-300 transition"
          >
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </main>
  )
}

export { LoginForm }