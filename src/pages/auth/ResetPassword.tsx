import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const schema = z.object({ email: z.string().email() })
type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Restablecer contraseña</h1>
      {done ? (
        <div className="space-y-3">
          <p>Si el correo existe, se envió un enlace para restablecer la contraseña.</p>
          <button
            className="text-blue-600 hover:underline"
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1)
              } else {
                navigate('/login')
              }
            }}
          >
            Volver al login
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(async ({ email }) => {
            await resetPassword(email)
            setDone(true)
          })}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium">Correo</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              type="email"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <button
            disabled={isSubmitting}
            className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
          >
            {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
    </div>
  )
}
