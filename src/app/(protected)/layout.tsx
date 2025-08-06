import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { BottomNav } from '@/components/organisms/navigation/BottomNav'
import { ToastProvider } from '@/context/ToastContext'

type Props = { children: ReactNode }

export default async function ProtectedLayout({ children }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) 
    redirect('/')

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-indigo-900">
        <BottomNav></BottomNav>
        <main className="flex-1">{children}</main>
      </div>
    </ToastProvider>
  )
}
