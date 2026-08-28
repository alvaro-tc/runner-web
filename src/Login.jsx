import { useState } from 'react'
import { login } from './api'

export default function Login({ onLogin, onGoToRegister }) {
  // La API entra por email o por CI con un unico campo, asi que el formulario
  // pide "identificador" y no email: un `type="email"` impedia escribir una CI.
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [estado, setEstado] = useState({ cargando: false })

  async function onSubmit(e) {
    e.preventDefault()
    setEstado({ cargando: true })
    try {
      const sesion = await login(identifier.trim(), password)
      setEstado({ cargando: false })
      if (onLogin) onLogin(sesion)
    } catch (err) {
      setEstado({ cargando: false, error: err.message })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-deco">
        <div className="auth-circle auth-circle-1" />
        <div className="auth-circle auth-circle-2" />
        <div className="auth-circle auth-circle-3" />
      </div>
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">🏃‍♀️</div>
          <h2>¡Bienvenida de vuelta!</h2>
          <p>Inicia sesión para gestionar tu inscripción</p>
        </div>
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            Correo electrónico o CI
            <input
              type="text"
              required
              value={identifier}
              autoComplete="username"
              placeholder="tu@correo.com o 1234567 LP"
              onChange={e => setIdentifier(e.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              required
              value={password}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          {estado.error && <p className="auth-error">{estado.error}</p>}
          <button type="submit" className="btn-primary auth-submit" disabled={estado.cargando}>
            {estado.cargando ? 'Entrando…' : 'Entrar 💜'}
          </button>
        </form>
        <p className="auth-switch">
          ¿No tienes cuenta?{' '}
          <a href="#" onClick={e => { e.preventDefault(); onGoToRegister?.() }}>
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  )
}
