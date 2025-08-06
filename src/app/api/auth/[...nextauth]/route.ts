// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

// only these two exports are allowed in a Next.js Route file
export { handler as GET, handler as POST }
