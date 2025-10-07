import { collection, getDocs, orderBy, query, where, type QueryConstraint } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type {
	CaseStatus,
	IntakeChannel,
	OirsCase,
	RequestType,
	SlaStatus,
} from '../types/oirs'

export type MetricsFilters = {
	startDate: string
	endDate: string
	sectorIds: string[]
	requestTypes: RequestType[]
	statuses: CaseStatus[]
	slaStatuses: SlaStatus[]
	intakeChannels: IntakeChannel[]
}

export type MetricsRow = {
	raw: OirsCase
	responseDays: number | null
	monthKey: string
}

export type MetricsResult = {
	rows: MetricsRow[]
	totals: {
		totalCases: number
		respondedCases: number
		openCases: number
		averageResponseDays: number | null
		medianResponseDays: number | null
	}
	byStatus: { status: CaseStatus; count: number }[]
	byRequestType: { requestType: RequestType; count: number }[]
	bySla: { sla: SlaStatus; count: number }[]
	bySector: { sectorId: string; count: number }[]
	byIntakeChannel: { intakeChannel: IntakeChannel; count: number }[]
	monthlyTrend: {
		monthKey: string
		date: Date
		cases: number
		responded: number
		avgResponseDays: number | null
	}[]
}

const CASES_COLLECTION = 'oirs_cases'

export async function fetchMetrics(filters: MetricsFilters): Promise<MetricsResult> {
	const cons: QueryConstraint[] = []
	const startIso = filters.startDate ? startOfDayIso(filters.startDate) : null
	const endIso = filters.endDate ? endOfDayIso(filters.endDate) : null

	if (startIso) cons.push(where('receivedAt', '>=', startIso))
	if (endIso) cons.push(where('receivedAt', '<=', endIso))

	if (filters.sectorIds.length === 1) {
		cons.push(where('sectorId', '==', filters.sectorIds[0]))
	} else if (filters.sectorIds.length > 1 && filters.sectorIds.length <= 10) {
		cons.push(where('sectorId', 'in', filters.sectorIds))
	}

	const snap = await getDocs(query(collection(db, CASES_COLLECTION), ...cons, orderBy('receivedAt')))

	const cases: OirsCase[] = snap.docs.map((docSnap) => {
		const data = docSnap.data() as OirsCase
		return { ...data, id: docSnap.id }
	})

		const filtered = cases.filter((c) => matchesFilters(c, filters))
	const rows = filtered.map((c) => buildRow(c))

	return buildAggregations(rows)
}

function matchesFilters(caseItem: OirsCase, filters: MetricsFilters): boolean {
	if (filters.requestTypes.length > 0 && !filters.requestTypes.includes(caseItem.requestType)) {
		return false
	}
	if (filters.statuses.length > 0 && !filters.statuses.includes(caseItem.status)) {
		return false
	}
	if (filters.slaStatuses.length > 0 && !filters.slaStatuses.includes(caseItem.sla)) {
		return false
	}
	if (
		filters.intakeChannels.length > 0 &&
		!filters.intakeChannels.includes(caseItem.intakeChannel)
	) {
		return false
	}
	if (filters.sectorIds.length > 0 && !filters.sectorIds.includes(caseItem.sectorId)) {
		return false
	}
	return true
}

function buildRow(caseItem: OirsCase): MetricsRow {
	const receivedAt = toDate(caseItem.receivedAt)
	const respondedAt = toDate(caseItem.respondedAt)
	const responseDays = receivedAt && respondedAt ? diffInDays(receivedAt, respondedAt) : null
	return {
		raw: caseItem,
		responseDays,
		monthKey: monthKeyFor(receivedAt ?? new Date(caseItem.receivedAt ?? Date.now())),
	}
}

function buildAggregations(rows: MetricsRow[]): MetricsResult {
	const byStatus = new Map<CaseStatus, number>()
	const byRequestType = new Map<RequestType, number>()
	const bySla = new Map<SlaStatus, number>()
	const bySector = new Map<string, number>()
	const byIntake = new Map<IntakeChannel, number>()
	const monthly = new Map<
		string,
		{ date: Date; cases: number; responded: number; totalResponseDays: number; respondedCount: number }
	>()

	const responseDaysList: number[] = []

	rows.forEach((row) => {
		const { raw, responseDays, monthKey } = row
		increment(byStatus, raw.status)
		increment(byRequestType, raw.requestType)
		increment(bySla, raw.sla)
		increment(bySector, raw.sectorId)
		increment(byIntake, raw.intakeChannel)

		if (!monthly.has(monthKey)) {
			const monthDate = monthKeyToDate(monthKey)
			monthly.set(monthKey, {
				date: monthDate,
				cases: 0,
				responded: 0,
				totalResponseDays: 0,
				respondedCount: 0,
			})
		}
		const bucket = monthly.get(monthKey)!
		bucket.cases += 1
		if (responseDays != null) {
			bucket.responded += 1
			bucket.totalResponseDays += responseDays
			bucket.respondedCount += 1
			responseDaysList.push(responseDays)
		}
	})

	const respondedCases = responseDaysList.length
	const averageResponseDays = respondedCases > 0 ? average(responseDaysList) : null
	const medianResponseDays = respondedCases > 0 ? median(responseDaysList) : null

	return {
		rows,
		totals: {
			totalCases: rows.length,
			respondedCases,
			openCases: rows.length - respondedCases,
			averageResponseDays,
			medianResponseDays,
		},
		byStatus: [...byStatus.entries()].map(([status, count]) => ({ status, count })),
		byRequestType: [...byRequestType.entries()].map(([requestType, count]) => ({ requestType, count })),
		bySla: [...bySla.entries()].map(([sla, count]) => ({ sla, count })),
		bySector: [...bySector.entries()].map(([sectorId, count]) => ({ sectorId, count })),
		byIntakeChannel: [...byIntake.entries()].map(([intakeChannel, count]) => ({ intakeChannel, count })),
		monthlyTrend: [...monthly.entries()]
			.map(([monthKey, bucket]) => ({
				monthKey,
				date: bucket.date,
				cases: bucket.cases,
				responded: bucket.responded,
				avgResponseDays:
					bucket.respondedCount > 0 ? bucket.totalResponseDays / bucket.respondedCount : null,
			}))
			.sort((a, b) => a.date.getTime() - b.date.getTime()),
	}
}

function increment<T>(store: Map<T, number>, key: T) {
	store.set(key, (store.get(key) ?? 0) + 1)
}

function toDate(value: string | null | undefined): Date | null {
	if (!value) return null
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}

function diffInDays(start: Date, end: Date): number {
	const ms = end.getTime() - start.getTime()
	return Math.max(Math.round(ms / 86_400_000), 0)
}

function monthKeyFor(date: Date): string {
	const year = date.getUTCFullYear()
	const month = String(date.getUTCMonth() + 1).padStart(2, '0')
	return `${year}-${month}`
}

function monthKeyToDate(key: string): Date {
	const [year, month] = key.split('-').map((v) => parseInt(v, 10))
	return new Date(Date.UTC(year, (month || 1) - 1, 1))
}

function average(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)
	if (sorted.length % 2 === 0) {
		return (sorted[mid - 1] + sorted[mid]) / 2
	}
	return sorted[mid]
}

function startOfDayIso(date: string): string {
	const [year, month, day] = date.split('-').map((value) => parseInt(value, 10))
	return new Date(Date.UTC(year, (month || 1) - 1, day || 1, 0, 0, 0, 0)).toISOString()
}

function endOfDayIso(date: string): string {
	const [year, month, day] = date.split('-').map((value) => parseInt(value, 10))
	return new Date(Date.UTC(year, (month || 1) - 1, day || 1, 23, 59, 59, 999)).toISOString()
}

