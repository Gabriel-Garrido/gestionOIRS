import { useEffect, useMemo, useState } from 'react'
import Modal from './ui/Modal'
import Input from './ui/Input'
import Select from './ui/Select'
import Button from './ui/Button'
import { listSectors, listStaff, upsertStaff } from '../services/oirsRepo'

type Props = {
  open: boolean
  onClose: () => void
  onCreated?: (id: string) => void
}

export default function NewStaffModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  // rut eliminado
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

  const emailValid = useMemo(() => /.+@.+\..+/.test(email), [email])
  const baseValid = useMemo(
    () => Boolean(name.trim()) && Boolean(role.trim()) && emailValid,
    [name, role, emailValid]
  )
  const jefeValid = useMemo(() => isChief || Boolean(chiefId), [isChief, chiefId])
  const valid = baseValid && jefeValid

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const [s, staff] = await Promise.all([listSectors(), listStaff()])
      setSectors((s ?? []).map((x) => ({ id: x.id!, name: x.name })))
      setChiefOptions(
        (staff ?? [])
          .filter((st) => st.isChief)
          .map((st) => ({ id: st.id!, name: st.name, email: st.email }))
      )
    })()
  }, [open])

  useEffect(() => {
    if (isChief) setChiefId('')
  }, [isChief])

  useEffect(() => {
    if (!open) {
      setName('')
      setEmail('')
      setRole('')
      setSectorIds([])
      setActive(true)
      setIsChief(false)
      setChiefId('')
      setSaving(false)
    }
  }, [open])

  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.trim(),
        sectorIds,
        active,
        isChief,
        chiefId: isChief ? null : chiefId || null,
      }
      const id = await upsertStaff(payload)
      onCreated?.(id)
      onClose()
      // reset simple
      setName('')
      // rut eliminado
      setEmail('')
      setRole('')
      setSectorIds([])
      setActive(true)
      setIsChief(false)
      setChiefId('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear nuevo funcionario"
      backdrop="blur"
      fullOnMobile
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={!valid || saving}>
            Crear
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600">Nombre</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div>{/* RUT eliminado */}</div>
            <div>
              <label className="text-sm font-medium text-slate-600">Rol/Cargo</label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ej: Enfermera coordinadora"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Email institucional *</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@hospital.cl"
              />
              {!emailValid && email.length > 0 && (
                <p className="mt-1 text-xs text-red-600">Ingresa un email válido.</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600">Sectores asignados</label>
              <Select
                multiple
                value={sectorIds}
                onChange={(e) =>
                  setSectorIds(
                    Array.from(e.target.selectedOptions, (option) => option.value).filter(Boolean)
                  )
                }
              >
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                Puedes dejarlo vacío y asignar sectores más adelante.
              </p>
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-4 border-t border-slate-100 pt-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={isChief}
                  onChange={(e) => setIsChief(e.target.checked)}
                />
                Es jefe/a
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Activo
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600">Jefatura asignada</label>
              <Select
                value={chiefId}
                disabled={isChief || (!isChief && chiefOptions.length === 0)}
                onChange={(e) => setChiefId(e.target.value)}
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
              {!isChief && chiefOptions.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Primero crea a la jefatura marcando la opción "Es jefe/a".
                </p>
              )}
              {!isChief && !chiefId && chiefOptions.length > 0 && (
                <p className="mt-1 text-xs text-amber-600">Selecciona la jefatura responsable.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
