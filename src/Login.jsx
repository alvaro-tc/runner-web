import { useEffect, useRef, useState } from 'react'
import { login, loginWithGoogle } from './api'

export default function Login({ onLogin, onGoToRegister }) {
  // La API entra por email o por CI con un unico campo.
  // Mantenemos la lógica intacta para no romper el backend.
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
      <AuthAside />
      
      <div className="auth-card">
        <div className="auth-card-header">
          {/* Se eliminó el emoji gigante y se usó un copy más formal */}
          <h2>Acceso a tu cuenta</h2>
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
              placeholder="ej. usuario@correo.com o 1234567"
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
              placeholder="Ingresa tu contraseña"
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          
          {estado.error && <p className="auth-error">{estado.error}</p>}
          
          {/* Se limpió el texto del botón de estados de carga y emojis */}
          <button type="submit" className="btn-primary auth-submit" disabled={estado.cargando}>
            {estado.cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <GoogleButton onSesion={onLogin} />
        
        <p className="auth-switch">
          ¿No tienes una cuenta?{' '}
          <a href="#" onClick={e => { e.preventDefault(); onGoToRegister?.() }}>
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  )
}
/// Fondo y columna de bienvenida compartidos por login y registro
export function AuthAside() {
  return (
    <>
      <div className="auth-bg" aria-hidden="true"><img src="/landing/lapaz-banda.jpg" alt="" /></div>
      <div className="auth-aside">
        <h1>Alistá los tenis.<span>Corremos por una buena causa.</span></h1>
        <ul>
          <li><b>Fecha</b>Domingo 22 de noviembre, 08:00</li>
          <li><b>Partida</b>Av. Montenegro, San Miguel</li>
          <li><b>Distancias</b>5 km y 1.5 km</li>
          <li><b>Destino</b>100% al Centro de Apoyo a la Mujer</li>
        </ul>
      </div>
    </>
  )
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
let gsi

// Script de Google Identity Services: se carga una sola vez aunque se pase de login a registro
function loadGsi() {
  return gsi ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = resolve
    s.onerror = () => { gsi = null; reject() }
    document.head.append(s)
  })
}

/// Boton "Continuar con Google", compartido por login y registro
export function GoogleButton({ onSesion }) {
  const ref = useRef(null)
  const [error, setError] = useState()

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    loadGsi().then(() => {
      if (!ref.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError()
          try {
            onSesion?.(await loginWithGoogle(credential))
          } catch (err) {
            setError(err.message)
          }
        },
      })
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        locale: 'es',
        width: Math.min(400, ref.current.offsetWidth),
      })
    }).catch(() => setError('No pudimos cargar el acceso con Google.'))
  }, [])

  if (!GOOGLE_CLIENT_ID) return null
  return (
    <>
      <p className="auth-divider">o</p>
      <div ref={ref} className="auth-google" />
      {error && <p className="auth-error">{error}</p>}
    </>
  )
}
