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
    <form className="card login" onSubmit={onSubmit}>
      <h3>Crear cuenta</h3>
      <label>
        Nombre completo
        <input
          type="text"
          required
          value={name}
          autoComplete="name"
          onChange={(e) => setName(e.target.value)}
        />
      </label>
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
          minLength={8}
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <p className="hint">Mínimo 8 caracteres, con al menos una letra y un número.</p>
      {estado.error && <p className="error">{estado.error}</p>}
      <button type="submit" disabled={estado.cargando}>
        {estado.cargando ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
      <p className="foot-link">
        ¿Ya tenés cuenta?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onGoToLogin?.() }}>
          Iniciá sesión
        </a>
      </p>
    </form>
  )
}
