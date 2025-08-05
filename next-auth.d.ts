// next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      /** The user's unique ID (UUID) */
      id: string
      /** The user's unique username */
      username: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    /** This comes from the Credentials authorize() return */
    username: string
  }
}
