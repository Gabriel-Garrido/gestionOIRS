import { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import Input from './ui/Input'
import Button from './ui/Button'
import Select from './ui/Select'
import type { Sector } from '../types/oirs'
import Loading from './ui/Loading'
import { upsertSector, listStaff } from '../services/oirsRepo'

export default function NewSectorModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}) {
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [chiefOptions, setChiefOptions] = useState<{ label: string; value: string }[]>([])
  const [selectedChief, setSelectedChief] = useState<string>('')

  useEffect(() => {
    if (!open) return
    async function fetchStaff() {
      const staff = await listStaff()
      setChiefOptions(
        staff
          .filter((s) => s.isChief)
          .map((s) => ({ label: `${s.name} · ${s.email}`, value: s.id || '' }))
          .filter((s) => s.value)
      )
    }
    fetchStaff()
  }, [open])

  useEffect(() => {
    if (!open) {
      setName('')
      setActive(true)
      setSelectedChief('')
      setSaving(false)
    }
  }, [open])

  async function save() {
    setSaving(true)
    try {
      const id = crypto.randomUUID() // Generar un UUID único
      const code = `sector_${name.replace(/\s+/g, '_').toLowerCase()}`
      const sectorData: Sector = {
        id,
        name: name.trim(),
        code,
        active,
        chiefId: selectedChief || null,
      }

      await upsertSector(sectorData)
      onCreated?.()
      onClose()
      setName('')
      setActive(true)
      setSelectedChief('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo Sector"
      size="md"
      backdrop="blur"
      fullOnMobile
      closeOnOverlayClick={false}
      footer={
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
          <Button variant="outline" size="md" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            disabled={saving || !name.trim()}
            onClick={save}
          >
            {saving ? <Loading text="Guardando…" className="text-sm" /> : 'Guardar'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-600">Nombre</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm text-slate-600">Activo</label>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">Jefe/a de sector</label>
          <Select value={selectedChief} onChange={(e) => setSelectedChief(e.target.value)}>
            <option value="">Selecciona una jefatura</option>
            {chiefOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  )
}
