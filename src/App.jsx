import { useEffect, useState } from 'react'
import Header from './Header'
import Login from './Login'
import Register from './Register'
import PanelAdmin from './PanelAdmin'
import RunnerDashboard from './RunnerDashboard'
import { esStaff } from './roles'
import Landing, { PasosInscripcion } from './Landing'

function leerSesionGuardada() {
  try {
    const raw = localStorage.getItem('auth.sesion')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function App() {
  const [sesion, setSesionState] = useState(leerSesionGuardada)
  const [seccion, setSeccion] = useState('inicio')
  const [vista, setVista] = useState('login')
  const [verPasos, setVerPasos] = useState(false)

  function setSesion(nuevaSesion) {
    setSesionState(nuevaSesion)
    try {
      if (nuevaSesion) localStorage.setItem('auth.sesion', JSON.stringify(nuevaSesion))
      else localStorage.removeItem('auth.sesion')
    } catch {}
  }

  function cerrarSesion() {
    setSesion(null)
    setSeccion('inicio')
    setVista('login')
  }

  // api.js avisa cuando el refresh token tambien vencio: se vuelve al login en vez de dejar el panel roto
  useEffect(() => {
    const vencida = () => { cerrarSesion(); setSeccion('auth') }
    window.addEventListener('auth:expirada', vencida)
    return () => window.removeEventListener('auth:expirada', vencida)
  }, [])

  // Intercepta las órdenes del Header para enrutar correctamente
  function manejarNavegacion(nuevaSeccion) {
    setVerPasos(false)
    if (nuevaSeccion === 'inscribirme') {
      setVerPasos(true)
    } else if (nuevaSeccion === 'acceso' || nuevaSeccion === 'registro') {
      setSeccion('auth')
      setVista(nuevaSeccion === 'acceso' ? 'login' : 'register')
      window.scrollTo(0, 0)
    } else {
      setSeccion(nuevaSeccion)
    }
  }

  function renderContent() {
    if (!sesion) {
      // Ahora escucha la sección unificada 'auth'
      if (seccion === 'auth' || seccion === 'acceso') {
        return (
          <main>
            {vista === 'login' ? (
              <Login onLogin={setSesion} onGoToRegister={() => setVista('register')} />
            ) : (
              <Register onRegister={setSesion} onGoToLogin={() => setVista('login')} />
            )}
          </main>
        )
      }

      return (
        <main>
          <Landing onInscribirme={() => setVerPasos(true)} />
        </main>
      )
    }

    return <RunnerDashboard sesion={sesion} onLogout={cerrarSesion} />
  }

  // El equipo tiene su propio panel con marca, módulos y salida: sin la barra del sitio
  if (sesion && esStaff(sesion.user.role)) return <PanelAdmin sesion={sesion} onLogout={cerrarSesion} />

  return (
    <div className="page">
      <Header
        sesion={sesion}
        onLogout={cerrarSesion}
        seccion={seccion}
        onSeccionChange={manejarNavegacion}
      />
      {renderContent()}
      {!sesion && (
        <PasosInscripcion
          abierto={verPasos}
          onCerrar={() => setVerPasos(false)}
          onRegistro={() => manejarNavegacion('registro')}
          onAcceso={() => manejarNavegacion('acceso')}
        />
      )}
    </div>
  )
}