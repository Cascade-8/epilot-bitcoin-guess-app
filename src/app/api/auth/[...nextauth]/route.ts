// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'
import { compare } from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Username & Password',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      // <-- Note the two parameters here
      authorize: async (creds) => {
        if (!creds?.username || !creds?.password) return null

        const user = await prisma.user.findUnique({
          where: { username: creds.username },
        })
        if (!user) return null

        const isValid = await compare(creds.password, user.password)
        if (!isValid) return null

        // Return exactly the NextAuth User shape:
        return {
          id: user.id,
          username: user.username,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
      }
      return token
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string
      session.user.username = token.username as string
      return session
    },
  },
  pages: { signIn: '/game-engine/config', error: '/' },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
