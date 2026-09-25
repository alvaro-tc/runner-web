import { useState } from 'react'
import Header from './Header'
import Login from './Login'
import Register from './Register'
import AdminDashboard from './AdminDashboard'
import RunnerDashboard from './RunnerDashboard'
import { esStaff } from './roles'
import Hero from './components/Hero'
import AboutUs from './components/AboutUs'
import Races from './components/Races'
import Testimonials from './components/Testimonials'
import Resources from './components/Resources'
import Contact from './components/Contact'
import Footer from './components/Footer'

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

  function irAcceso() {
    setSeccion('auth')
    setVista('login')
  }

  // Intercepta las órdenes del Header para enrutar correctamente
  function manejarNavegacion(nuevaSeccion) {
    if (nuevaSeccion === 'acceso') {
      setSeccion('auth')
      setVista('login')
    } else if (nuevaSeccion === 'registro') {
      setSeccion('auth')
      setVista('register')
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
          <Hero onAcceso={irAcceso} />
          <AboutUs />
          <Races onAcceso={irAcceso} />
          <Testimonials />
          <Resources />
          <Contact />
          <Footer onAcceso={irAcceso} />
        </main>
      )
    }

    if (esStaff(sesion.user.role)) {
      return <AdminDashboard sesion={sesion} onLogout={cerrarSesion} />
    }

    return <RunnerDashboard sesion={sesion} onLogout={cerrarSesion} />
  }

  return (
    <div className="page">
      <Header
        sesion={sesion}
        onLogout={cerrarSesion}
        seccion={seccion}
        onSeccionChange={manejarNavegacion}
      />
      {renderContent()}
    </div>
  )
}