import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <section>
      <h1>Página no encontrada</h1>
      <p>La ruta solicitada no existe.</p>
      <p>
        <button
          className="text-blue-600 hover:underline"
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1)
            } else {
              navigate('/')
            }
          }}
        >
          Volver al inicio
        </button>
      </p>
    </section>
  )
}
