import { db } from './client'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type UpdateData,
} from 'firebase/firestore'

export function col(path: string) {
  return collection(db, path)
}

export function ref(path: string, id: string) {
  return doc(db, path, id)
}

export async function getAll(path: string) {
  const q = query(col(path), orderBy('fechaIngreso', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getById(path: string, id: string) {
  const d = await getDoc(ref(path, id))
  return d.exists() ? { id: d.id, ...d.data() } : null
}

export async function create(path: string, data: Record<string, unknown>) {
  return addDoc(col(path), { ...data, createdAt: serverTimestamp() })
}

export async function put(path: string, id: string, data: Record<string, unknown>) {
  return setDoc(ref(path, id), data, { merge: true })
}

export async function patch(path: string, id: string, data: Record<string, unknown>) {
  // Firestore UpdateData exige FieldValue | Partial<T>; aceptamos Record<string, unknown>
  // y confiamos en que el caller proveerá tipos válidos para Firestore.
  return updateDoc(ref(path, id), data as UpdateData<unknown>)
}

export { where, query, orderBy }
