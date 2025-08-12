import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Bitcoin Price Guesser',
  description: 'Created by Cascade',
  icons: {
    icon: '/cascade.png',
    shortcut: '/cascade.png',
    apple: '/cascade.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={'antialiased bg-indigo-900'}
      >
        {children}
      </body>
    </html>
  )
}
