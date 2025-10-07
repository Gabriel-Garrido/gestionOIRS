import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { create } from '../../services/firebase/firestore'
import { uploadFile } from '../../services/firebase/storage'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  asunto: z.string().min(3),
  detalle: z.string().min(5),
  tipo: z.enum(['informacion', 'reclamo', 'sugerencia', 'felicitacion']),
  archivos: z.any().optional(),
})
type FormData = z.infer<typeof schema>

export default function CreateSolicitud() {
  const nav = useNavigate()
  const { user } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Nueva solicitud</h1>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (data) => {
          const adjuntos: { name: string; path: string; url: string; size: number }[] = []
          const files: FileList | undefined = (data as unknown as { archivos?: FileList }).archivos
          if (files && files.length) {
            for (const f of Array.from(files)) {
              const up = await uploadFile('adjuntos', f)
              adjuntos.push({ ...up, size: f.size })
            }
          }
          const doc = await create('solicitudes', {
            folio: crypto.randomUUID().slice(0, 8).toUpperCase(),
            asunto: data.asunto,
            detalle: data.detalle,
            tipo: data.tipo,
            estado: 'ingresada',
            solicitanteUid: user?.uid ?? 'anon',
            fechaIngreso: new Date(),
            adjuntos,
          })
          nav(`/solicitudes/${doc.id}`)
        })}
      >
        <div>
          <label className="block text-sm font-medium">Asunto</label>
          <input className="mt-1 w-full rounded border px-3 py-2" {...register('asunto')} />
          {errors.asunto && <p className="text-sm text-red-600">{errors.asunto.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Detalle</label>
          <textarea
            className="mt-1 w-full rounded border px-3 py-2"
            rows={5}
            {...register('detalle')}
          />
          {errors.detalle && <p className="text-sm text-red-600">{errors.detalle.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Tipo</label>
          <select className="mt-1 w-full rounded border px-3 py-2" {...register('tipo')}>
            <option value="informacion">Solicitud de información</option>
            <option value="reclamo">Reclamo</option>
            <option value="sugerencia">Sugerencia</option>
            <option value="felicitacion">Felicitación</option>
          </select>
          {errors.tipo && <p className="text-sm text-red-600">{errors.tipo.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Adjuntos (opcional)</label>
          <input className="mt-1 w-full" type="file" multiple {...register('archivos')} />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Crear
          </button>
        </div>
      </form>
    </div>
  )
}
