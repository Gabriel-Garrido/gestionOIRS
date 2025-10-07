import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStaff, upsertStaff, listSectors, listStaff } from '../../services/oirsRepo'
import PageHeader from '../../components/ui/PageHeader'
import BackButton from '../../components/ui/BackButton'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'

export default function StaffEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [sectorIds, setSectorIds] = useState<string[]>([])
  const [active, setActive] = useState(true)
  const [isChief, setIsChief] = useState(false)
  const [chiefId, setChiefId] = useState('')
  const [saving, setSaving] = useState(false)
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([])
  const [chiefOptions, setChiefOptions] = useState<
    Array<{ id: string; name: string; email: string }>
  >([])

  useEffect(() => {
    if (!id) return
    let mounted = true
    ;(async () => {
      const [staff, sectorsData, staffList] = await Promise.all([
        getStaff(id),
        listSectors(),
        listStaff(),
      ])
      if (!mounted) return
      if (staff) {
        setName(staff.name)
        setEmail(staff.email)
        setRole(staff.role)
        setSectorIds(staff.sectorIds ?? [])
        setActive(staff.active)
        setIsChief(staff.isChief ?? false)
        setChiefId(staff.chiefId ?? '')
      }
      setSectors((sectorsData ?? []).map((s) => ({ id: s.id ?? '', name: s.name })))
      const options = (staffList ?? [])
        .filter((s) => s.isChief && s.id !== id)
        .map((s) => ({ id: s.id!, name: s.name, email: s.email }))
      if (staff?.chiefId) {
        const currentChief = staffList?.find((s) => s.id === staff.chiefId)
        if (currentChief && options.every((o) => o.id !== currentChief.id)) {
          options.push({ id: currentChief.id!, name: currentChief.name, email: currentChief.email })
        }
      }
      setChiefOptions(options)
    })()
    return () => {
      mounted = false
    }
  }, [id])

  async function save() {
    setSaving(true)
    try {
      const payload = {
        id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.trim(),
        sectorIds,
        active,
        isChief,
        chiefId: isChief ? null : chiefId || null,
      }
      await upsertStaff(payload)
      navigate(`/catalogs/staff/${id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Editar Funcionario" actions={<BackButton fallback="/catalogs/staff" />} />

      <Section title="Datos del funcionario">
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Rol</label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Sectores</label>
              <Select
                multiple
                value={sectorIds}
                onChange={(e) =>
                  setSectorIds(
                    Array.from(e.target.selectedOptions, (option) => option.value).filter(Boolean)
                  )
                }
              >
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                Mantén presionada la tecla Ctrl (Cmd en Mac) para seleccionar varios.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Condiciones</label>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isChief}
                    onChange={(e) => {
                      setIsChief(e.target.checked)
                      if (e.target.checked) setChiefId('')
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Es jefe/a
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Activo
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Jefatura asignada</label>
              <Select
                value={chiefId}
                onChange={(e) => setChiefId(e.target.value)}
                disabled={isChief}
              >
                <option value="">
                  {isChief ? 'No aplica para jefes' : 'Selecciona un jefe/a'}
                </option>
                {chiefOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} · {option.email}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Actualizado el:{' '}
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </span>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="primary" onClick={save} disabled={saving}>
              Guardar
            </Button>
          </div>
        </Card>
      </Section>
    </div>
  )
}
