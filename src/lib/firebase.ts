// Reexportamos desde el cliente existente para seguir una ruta única
export { auth, db, storage, default as app, initAnalytics } from '../services/firebase/client'
