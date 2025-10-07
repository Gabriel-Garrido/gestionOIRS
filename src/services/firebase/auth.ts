import { auth } from './client'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
  signInWithEmailAndPassword,
} from 'firebase/auth'

export function onAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb)
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider)
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email)
}

export async function signOut() {
  return fbSignOut(auth)
}
