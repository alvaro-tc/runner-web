import { useState } from 'react'
import Header from './Header'
import Login from './Login'
import Register from './Register'
import AdminDashboard from './AdminDashboard'
import RunnerDashboard from './RunnerDashboard'
import Hero from './components/Hero'
import AboutUs from './components/AboutUs'
import Races from './components/Races'
import Testimonials from './components/Testimonials'
import Resources from './components/Resources'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  const [sesion, setSesion] = useState(null)
  const [seccion, setSeccion] = useState('inicio')
  const [vista, setVista] = useState('login')

  function cerrarSesion() {
    setSesion(null)
    setSeccion('inicio')
    setVista('login')
  }

  function irAcceso() {
    setSeccion('acceso')
    setVista('login')
  }

  function renderContent() {
    if (!sesion) {
      if (seccion === 'acceso') {
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

    if (sesion.user.role === 'admin') {
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
        onSeccionChange={setSeccion}
      />
      {renderContent()}
    </div>
  )
}
