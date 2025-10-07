import { useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { onAuth } from '../services/firebase/auth'
import { AuthContext } from './authContextValue'

type AuthContextType = React.ContextType<typeof AuthContext>

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuth((u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      async signInGoogle() {
        const { signInWithGoogle } = await import('../services/firebase/auth')
        await signInWithGoogle()
      },
      async signInEmail(email: string, password: string) {
        const { signInWithEmail } = await import('../services/firebase/auth')
        await signInWithEmail(email, password)
      },
      async signOut() {
        const { signOut } = await import('../services/firebase/auth')
        await signOut()
      },
      async resetPassword(email: string) {
        const { resetPassword } = await import('../services/firebase/auth')
        await resetPassword(email)
      },
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Nota: el hook useAuth ahora vive en src/hooks/useAuth.ts
