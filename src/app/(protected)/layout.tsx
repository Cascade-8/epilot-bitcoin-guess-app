import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { BottomNav } from '@/components/organisms/navigation/BottomNav'
import { ToastProvider } from '@/context/ToastContextProvider'

type Props = { children: ReactNode }

export default async function ProtectedLayout({ children }: Props) {
  // run on the server—fetch session
  const session = await getServerSession(authOptions)

  // if no session, kick to signin
  if (!session) 
    redirect('/')
  

  // otherwise render the protected UI
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-indigo-900">
        {/* you can put a header/nav here */}
        <BottomNav></BottomNav>
        <main className="flex-1">{children}</main>
      </div>
    </ToastProvider>
  )
}
