// Servicio opcional para cargar feriados chilenos desde Nager.Date
// Nota: en MVP evitamos llamadas externas por defecto; usar bajo responsabilidad y cachear en Firestore si es posible.
export async function fetchChileHolidays(year: number): Promise<string[]> {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/CL`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Holidays fetch failed: ${res.status}`)
  const data = (await res.json()) as Array<{ date: string }>
  // Nager devuelve { date: '2025-01-01', ... }. Convertimos a array de 'YYYY-MM-DD'
  return Array.isArray(data) ? data.map((d) => d.date) : []
}
