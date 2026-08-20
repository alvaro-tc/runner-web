import { useState } from 'react'
import { login } from './api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [estado, setEstado] = useState({ cargando: false })

  async function onSubmit(e) {
    e.preventDefault()
    setEstado({ cargando: true })
    try {
      const sesion = await login(email, password)
      setEstado({ cargando: false, sesion })
    } catch (err) {
      setEstado({ cargando: false, error: err.message })
    }
  }

  if (estado.sesion) {
    return (
      <div className="card login">
        <h3>Sesión iniciada</h3>
        <p>
          {estado.sesion.user?.name} · {estado.sesion.user?.email} ({estado.sesion.user?.role})
        </p>
        <p className="token">accessToken: {estado.sesion.accessToken.slice(0, 24)}…</p>
        <button onClick={() => setEstado({ cargando: false })}>Cerrar</button>
      </div>
    )
  }

  return (
    <form className="card login" onSubmit={onSubmit}>
      <h3>Iniciar sesión</h3>
      <label>
        Correo
        <input
          type="email"
          required
          value={email}
          autoComplete="username"
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        Contraseña
        <input
          type="password"
          required
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {estado.error && <p className="error">{estado.error}</p>}
      <button type="submit" disabled={estado.cargando}>
        {estado.cargando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
