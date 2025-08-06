import { LoginForm } from '@/components/organisms/forms/LoginForm'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)

  // if there’s a session, send them straight to the game dashboard
  if (session) 
    redirect('/game-engine/game')
  

  // otherwise show the login form
  return <LoginForm />
}