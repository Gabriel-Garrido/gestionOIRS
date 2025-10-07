import { createContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthContextType = {
  user: User | null
  loading: boolean
  signInGoogle: () => Promise<void>
  signInEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
