import { db } from '../lib/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  setDoc,
  type DocumentData,
  type DocumentSnapshot,
  runTransaction,
} from 'firebase/firestore'
import type { OirsCase, CaseEvent, SlaStatus, Sector, Staff } from '../types/oirs'
import { calcSla } from '../hooks/useSla'

export type ListFilters = Partial<{
  sectorId: string
  requestType: string
  status: string
  sla: SlaStatus
  folio: string
  receivedFrom: string // ISO
  receivedTo: string // ISO
  staffId: string // filtrar por funcionario aludido
}>

const CASES = 'oirs_cases'

function fromSnap(s: DocumentSnapshot<DocumentData>): OirsCase {
  const d = s.data() as DocumentData
  return { id: s.id, ...(d as unknown as OirsCase) }
}

export async function getCase(id: string): Promise<OirsCase | null> {
  const s = await getDoc(doc(db, CASES, id))
  return s.exists() ? fromSnap(s) : null
}

export type ListPage = { items: OirsCase[]; nextCursor?: DocumentSnapshot<DocumentData> }

export async function listCases(
  filters: ListFilters,
  pageSize = 10,
  cursor?: DocumentSnapshot<DocumentData>
): Promise<ListPage> {
  const cons: import('firebase/firestore').QueryConstraint[] = []
  // Equality filters
  if (filters.sectorId) cons.push(where('sectorId', '==', filters.sectorId))
  if (filters.requestType) cons.push(where('requestType', '==', filters.requestType))
  if (filters.status) cons.push(where('status', '==', filters.status))
  // Filtro de folio por coincidencia parcial
  if (filters.folio) {
    cons.push(orderBy('folio'))
    cons.push(where('folio', '>=', filters.folio))
    cons.push(where('folio', '<=', filters.folio + '\uf8ff'))
  }
  if (filters.staffId) cons.push(where('allegedStaffIds', 'array-contains', filters.staffId))
  // Range on receivedAt
  if (filters.receivedFrom) cons.push(where('receivedAt', '>=', filters.receivedFrom))
  if (filters.receivedTo) cons.push(where('receivedAt', '<=', filters.receivedTo))

  const base = query(collection(db, CASES), ...cons, orderBy('receivedAt', 'desc'), limit(pageSize))
  const q = cursor ? query(base, startAfter(cursor)) : base
  const snap = await getDocs(q)
  let items: OirsCase[] = snap.docs.map(fromSnap)

  // SLA filter en cliente
  if (filters.sla) {
    items = items.filter(
      (c) => calcSla({ dueAt: c.dueAt, respondedAt: c.respondedAt }) === filters.sla
    )
  }

  const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined
  return { items, nextCursor }
}

export async function createCase(
  data: Omit<OirsCase, 'id' | 'sla' | 'createdAt' | 'updatedAt' | 'createdBy'> & {
    createdBy: string
  }
): Promise<string> {
  const now = new Date().toISOString()
  const enteredFolio = typeof data.folio === 'string' ? data.folio.trim() : undefined
  const finalFolio =
    enteredFolio && enteredFolio.length > 0
      ? enteredFolio
      : crypto.randomUUID().slice(0, 8).toUpperCase()
  // Enforce uniqueness with a secondary collection: folios/{folio}
  const folioKey = finalFolio
  const folioRef = doc(db, 'folios', folioKey)
  const newId = await runTransaction(db, async (tx) => {
    const folioSnap = await tx.get(folioRef)
    if (folioSnap.exists()) {
      throw new Error(`Folio ya existe: ${folioKey}`)
    }
    const ref = doc(collection(db, CASES))
    const payload: OirsCase = {
      ...data,
      folio: folioKey,
      sla: calcSla({ dueAt: data.dueAt, respondedAt: data.respondedAt }),
      createdAt: now,
      updatedAt: now,
    } as OirsCase
    tx.set(ref, payload as unknown as DocumentData)
    tx.set(folioRef, { caseId: ref.id, createdAt: now })
    return ref.id
  })
  return newId
}

export async function updateCase(id: string, data: Partial<OirsCase>) {
  const now = new Date().toISOString()
  // Filtrar valores undefined del objeto data
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  )
  const requestedFolio =
    typeof (filteredData as any).folio === 'string'
      ? String((filteredData as any).folio).trim()
      : undefined
  if (requestedFolio !== undefined) {
    ;(filteredData as any).folio = requestedFolio
  }
  const next: Partial<OirsCase> & { updatedAt: string } = { ...filteredData, updatedAt: now }

  if (data.dueAt !== undefined || data.respondedAt !== undefined) {
    // recompute SLA si cambian fechas relevantes
    const current = await getCase(id)
    const due = data.dueAt ?? (current?.dueAt as string)
    const resp = data.respondedAt ?? current?.respondedAt
    next.sla = calcSla({ dueAt: due, respondedAt: resp })
  }

  if (requestedFolio) {
    // Transaction to swap folio index if changed
    const caseRef = doc(db, CASES, id)
    const newFolioRef = doc(db, 'folios', requestedFolio)
    await runTransaction(db, async (tx) => {
      const caseSnap = await tx.get(caseRef)
      if (!caseSnap.exists()) throw new Error('Caso no existe')
      const current = caseSnap.data() as OirsCase
      if (current.folio === requestedFolio) {
        tx.update(caseRef, next as any)
        return
      }
      const newFolioSnap = await tx.get(newFolioRef)
      if (newFolioSnap.exists()) throw new Error(`Folio ya existe: ${requestedFolio}`)
      // delete old folio index
      const oldFolioRef = doc(db, 'folios', current.folio)
      tx.delete(oldFolioRef)
      // set new folio index and update case
      tx.set(newFolioRef, { caseId: id, updatedAt: now })
      tx.update(caseRef, next as any)
    })
  } else {
    await updateDoc(doc(db, CASES, id), next)
  }
}

export async function deleteCase(id: string) {
  await deleteDoc(doc(db, CASES, id))
}

export async function addEvent(caseId: string, ev: CaseEvent) {
  const ref = collection(db, CASES, caseId, 'events')
  const payload = { ...ev, at: ev.at ?? new Date().toISOString() }
  await addDoc(ref, payload as DocumentData)
}

// Acciones rápidas
export async function changeStatus(id: string, by: string, status: OirsCase['status']) {
  await updateCase(id, { status })
  await addEvent(id, {
    type: 'status_change',
    by,
    at: new Date().toISOString(),
    payload: { status },
  })
}

// Catálogos: sectors
const SECTORS = 'sectors'
export async function listSectors(): Promise<Sector[]> {
  const snap = await getDocs(query(collection(db, SECTORS), orderBy('name')))
  return snap.docs.map((d) => {
    const data = d.data() as Partial<Sector>
    return {
      id: d.id,
      name: data?.name ?? '',
      code: data?.code ?? '',
      active: data?.active ?? true,
      chiefId: data?.chiefId ?? null,
    }
  })
}
export async function upsertSector(sector: Sector): Promise<string> {
  const id = sector.id || crypto.randomUUID()
  const sectorRef = doc(db, 'sectors', id)
  const { chiefId = null, ...rest } = sector
  await setDoc(sectorRef, { ...rest, chiefId: chiefId ?? null, id }, { merge: true })
  return id
}

export async function getSector(id: string): Promise<Sector | null> {
  const s = await getDoc(doc(db, SECTORS, id))
  if (!s.exists()) return null
  const data = s.data() as Partial<Sector>
  return {
    id: s.id,
    name: data?.name ?? '',
    code: data?.code ?? '',
    active: data?.active ?? true,
    chiefId: data?.chiefId ?? null,
  }
}

// Catálogo: feriados (colección 'holidays', documento por año-país, ej: 'CL-2025')
export async function getHolidaysDoc(id: string): Promise<string[] | null> {
  const snap = await getDoc(doc(db, 'holidays', id))
  if (!snap.exists()) return null
  const data = snap.data() as DocumentData
  const days: unknown = data?.days
  return Array.isArray(days) ? (days as string[]) : null
}

// Catálogos: staff
const STAFF = 'staff'
export async function listStaff(): Promise<Staff[]> {
  const snap = await getDocs(collection(db, STAFF))
  return snap.docs.map((doc) => {
    const data = doc.data() as Partial<Staff>
    const sectorIds = Array.isArray((data as any)?.sectorIds)
      ? ((data as any).sectorIds as string[])
      : (data as any)?.sectorId
        ? [(data as any)?.sectorId as string]
        : []
    return {
      id: doc.id,
      email: data?.email ?? '',
      name: data?.name ?? '',
      role: data?.role ?? '',
      sectorIds,
      isChief: data?.isChief ?? false,
      chiefId: data?.chiefId ?? null,
      active: data?.active ?? true,
      createdAt: data?.createdAt ?? '',
      updatedAt: data?.updatedAt ?? '',
    }
  })
}
export async function upsertStaff(input: Omit<Staff, 'createdAt' | 'updatedAt'> & { id?: string }) {
  const now = new Date().toISOString()
  const { id, ...rest } = input
  const payload: DocumentData = {
    ...rest,
    isChief: !!rest.isChief,
    chiefId: rest.isChief ? null : (rest.chiefId ?? null),
    sectorIds: Array.isArray(rest.sectorIds)
      ? rest.sectorIds
      : rest.sectorIds
        ? [rest.sectorIds].flat()
        : [],
    updatedAt: now,
  }
  delete (payload as any).sectorId

  if (id) {
    await updateDoc(doc(db, STAFF, id), payload)
    return id
  }
  const ref = await addDoc(collection(db, STAFF), {
    ...payload,
    createdAt: now,
  } as DocumentData)
  return ref.id
}

export async function getStaff(id: string): Promise<Staff | null> {
  const s = await getDoc(doc(db, STAFF, id))
  if (!s.exists()) return null
  const data = s.data() as Partial<Staff>
  const sectorIds = Array.isArray((data as any)?.sectorIds)
    ? ((data as any).sectorIds as string[])
    : (data as any)?.sectorId
      ? [(data as any)?.sectorId as string]
      : []
  return {
    id: s.id,
    email: data?.email ?? '',
    name: data?.name ?? '',
    role: data?.role ?? '',
    sectorIds,
    isChief: data?.isChief ?? false,
    chiefId: data?.chiefId ?? null,
    active: data?.active ?? true,
    createdAt: data?.createdAt ?? '',
    updatedAt: data?.updatedAt ?? '',
  }
}

export async function listCasesByAllegedStaff(
  filters: { staffId: string; startDate?: string; endDate?: string },
  pageSize = 10,
  cursor?: DocumentSnapshot<DocumentData>
): Promise<ListPage> {
  const cons: import('firebase/firestore').QueryConstraint[] = [
    where('allegedStaffIds', 'array-contains', filters.staffId),
  ]

  if (filters.startDate) {
    cons.push(where('receivedAt', '>=', filters.startDate))
  }

  if (filters.endDate) {
    cons.push(where('receivedAt', '<=', filters.endDate))
  }

  const base = query(collection(db, CASES), ...cons, orderBy('receivedAt', 'desc'), limit(pageSize))
  const q = cursor ? query(base, startAfter(cursor)) : base
  const snap = await getDocs(q)
  const items = snap.docs.map(fromSnap)
  const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined
  return { items, nextCursor }
}

export async function listAllCases(
  filters: Partial<ListFilters>,
  pageSize = 200
): Promise<OirsCase[]> {
  const all: OirsCase[] = []
  let cursor: DocumentSnapshot<DocumentData> | undefined

  while (true) {
    const page = await listCases(filters, pageSize, cursor)
    all.push(...page.items)
    if (!page.nextCursor) break
    cursor = page.nextCursor
  }

  return all
}

export async function listCasesByAllegedStaffAll(
  filters: { staffId: string; startDate?: string; endDate?: string },
  pageSize = 200
): Promise<OirsCase[]> {
  const all: OirsCase[] = []
  let cursor: DocumentSnapshot<DocumentData> | undefined

  while (true) {
    const page = await listCasesByAllegedStaff(filters, pageSize, cursor)
    all.push(...page.items)
    if (!page.nextCursor) break
    cursor = page.nextCursor
  }

  return all
}
