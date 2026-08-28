import { useState } from 'react'
import { login } from './api'

export default function Login({ onLogin, onGoToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [estado, setEstado] = useState({ cargando: false })

  async function onSubmit(e) {
    e.preventDefault()
    setEstado({ cargando: true })
    try {
      const sesion = await login(email, password)
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
            Correo electrónico
            <input
              type="email"
              required
              value={email}
              autoComplete="username"
              placeholder="tu@correo.com"
              onChange={e => setEmail(e.target.value)}
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
