import { useState } from 'react'
import { register } from './api'

export default function Register({ onRegister, onGoToLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [estado, setEstado] = useState({ cargando: false })

  async function onSubmit(e) {
    e.preventDefault()
    setEstado({ cargando: true })
    try {
      const sesion = await register(name, email, password)
      setEstado({ cargando: false })
      if (onRegister) onRegister(sesion)
    } catch (err) {
      setEstado({ cargando: false, error: err.message })
    }
  }

  return (
    // Se agregó paddingTop y un padding general para evitar que el Header fijo lo tape
    <div className="auth-page" style={{ paddingTop: '80px', paddingBottom: '3rem' }}>
      <div className="auth-deco">
        <div className="auth-circle auth-circle-1" />
        <div className="auth-circle auth-circle-2" />
        <div className="auth-circle auth-circle-3" />
      </div>
      <div className="auth-card">
        
        <div className="auth-card-header">
          <h2>Crear una cuenta</h2>
          <p>Regístrate para gestionar tu inscripción al evento</p>
        </div>
        
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            Nombre completo
            <input
              type="text"
              required
              value={name}
              autoComplete="name"
              placeholder="Ej. Lucía Flores"
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label>
            Correo electrónico
            <input
              type="email"
              required
              value={email}
              autoComplete="username"
              placeholder="usuario@correo.com"
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              required
              minLength={8}
              value={password}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          <p className="auth-hint">Tu contraseña debe tener al menos 8 caracteres, incluyendo una letra y un número.</p>
          
          {estado.error && <p className="auth-error">{estado.error}</p>}
          
          <button type="submit" className="btn-primary auth-submit" disabled={estado.cargando}>
            {estado.cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        
        <p className="auth-switch">
          ¿Ya tienes cuenta?{' '}
          <a href="#" onClick={e => { e.preventDefault(); onGoToLogin?.() }}>
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  )
}