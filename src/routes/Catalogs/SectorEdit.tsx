import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSector, upsertSector, listStaff } from '../../services/oirsRepo'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import Loading from '../../components/ui/Loading'

export default function SectorEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [active, setActive] = useState(true)
  const [chiefId, setChiefId] = useState<string>('')
  const [chiefOptions, setChiefOptions] = useState<
    Array<{ id: string; name: string; email: string }>
  >([])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getSector(id), listStaff()]).then(([sector, staff]) => {
      if (sector) {
        setName(sector.name)
        setCode(sector.code)
        setActive(sector.active)
        setChiefId(sector.chiefId ?? '')
      }
      setChiefOptions(
        (staff ?? [])
          .filter((st) => st.isChief)
          .map((st) => ({ id: st.id!, name: st.name, email: st.email }))
      )
      setLoading(false)
    })
  }, [id])

  async function save() {
    if (!id) return
    setSaving(true)
    await upsertSector({ id, name, code, active, chiefId: chiefId || null })
    setSaving(false)
    navigate(`/catalogs/sectors/${id}`)
  }

  if (loading) return <Loading text="Cargando sector..." />

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <PageHeader title="Editar sector" />
      <Section title="Datos del sector">
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del sector"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Código</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Código único"
              />
            </div>
            <div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Activo
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jefe/a asignado</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={chiefId}
                onChange={(e) => setChiefId(e.target.value)}
                disabled={saving}
              >
                <option value="">Sin jefe/a</option>
                {chiefOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} · {option.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={save} disabled={saving || !name || !code}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </Card>
      </Section>
    </div>
  )
}
