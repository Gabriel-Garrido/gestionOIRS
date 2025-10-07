import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../hooks/useAuth'
import { Link, Navigate } from 'react-router-dom'
import Button from '../../components/ui/Button'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const { signInEmail, signInGoogle, user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (user) return <Navigate to="/cases" replace />

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-elevation2 ring-1 ring-black/5 sm:p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Iniciar sesión</h1>
          <p className="text-sm text-slate-600">
            Accede a la bandeja de casos con tus credenciales institucionales.
          </p>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit(async (data) => {
            setError(null)
            try {
              await signInEmail(data.email, data.password)
            } catch (e: unknown) {
              const msg =
                typeof e === 'object' && e && 'message' in e
                  ? String((e as { message?: unknown }).message)
                  : ''
              setError(msg || 'Error al iniciar sesión')
            }
          })}
          className="mt-6 space-y-4"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:outline-hidden focus:ring-3 focus:ring-brand-600/20"
              type="email"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:outline-hidden focus:ring-3 focus:ring-brand-600/20"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <Button type="submit" block loading={isSubmitting}>
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
        <Button
          type="button"
          block
          variant="outline"
          className="mt-4"
          onClick={() => signInGoogle()}
        >
          Ingresar con Google
        </Button>
        <div className="mt-4 text-center text-sm">
          <Button as={Link} to="/reset-password" variant="link" size="sm">
            ¿Olvidaste tu contraseña?
          </Button>
        </div>
      </div>
    </div>
  )
}
