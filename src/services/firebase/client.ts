import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || undefined,
}

function assertEnv<K extends keyof typeof firebaseConfig>(name: K) {
  if (!firebaseConfig[name]) {
    throw new Error(`Falta variable de entorno: ${name}`)
  }
}

assertEnv('apiKey')
assertEnv('authDomain')
assertEnv('projectId')
assertEnv('storageBucket')
assertEnv('messagingSenderId')
assertEnv('appId')

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app

// Inicialización opcional de Analytics (solo en navegador y si measurementId existe)
let analyticsInstance: Analytics | null = null
export async function initAnalytics() {
  if (!firebaseConfig.measurementId) return null
  if (typeof window === 'undefined') return null
  const supported = await isSupported().catch(() => false)
  if (!supported) return null
  if (!analyticsInstance) analyticsInstance = getAnalytics(app)
  return analyticsInstance
}
