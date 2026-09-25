import { useEffect, useState } from 'react'
import Header from './Header'
import Login from './Login'
import Register from './Register'
import AdminDashboard from './AdminDashboard'
import RunnerDashboard from './RunnerDashboard'
import { BASE, getMarathons } from './api'

const SERVICIOS = [
  { icon: '💜', title: 'Acompañamiento', text: 'Apoyo emocional y seguimiento personalizado para cada mujer que llega al centro.' },
  { icon: '⚖️', title: 'Orientación legal', text: 'Asesoría gratuita sobre derechos, denuncias y procesos de protección.' },
  { icon: '🏃‍♀️', title: 'Rutas seguras', text: 'Actividad física en grupo con rutas verificadas y acompañamiento en tiempo real.' },
  { icon: '📞', title: 'Línea de ayuda', text: 'Atención disponible todos los días para orientación inmediata.' },
]

export default function App() {
  const [sesion, setSesion] = useState(null)
  const [marathons, setMarathons] = useState([])
  const [marathonsError, setMarathonsError] = useState(null)
  const [seccion, setSeccion] = useState('inicio')
  const [vista, setVista] = useState('login')

  useEffect(() => {
    getMarathons()
      .then(setMarathons)
      .catch((err) => setMarathonsError(err.message))
  }, [])

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
        <>
          <section className="hero-photo">
            <div className="hero-art">
              <svg className="hero-route" viewBox="0 0 500 420" preserveAspectRatio="xMidYMid slice" fill="none">
                <path
                  d="M40 380 C 140 380, 120 260, 220 240 S 340 140, 300 60 S 420 20, 460 60"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray="2 14"
                  strokeLinecap="round"
                />
                <circle cx="40" cy="380" r="6" fill="white" />
                <circle cx="460" cy="60" r="6" fill="white" />
              </svg>
            </div>

            <div className="hero-card">
              <span className="eyebrow">CAM</span>
              <h1>Un espacio seguro para vos</h1>
              <p>
                Acompañamiento, orientación y comunidad para mujeres que han sufrido
                algún tipo de violencia. Estamos contigo en cada paso del camino.
              </p>
              <a className="cta" href="#servicios">Conocer servicios</a>
            </div>

            <div className="hero-stat">
              <span className="icon">🏃‍♀️</span>
              <div>
                <strong>Rutas seguras</strong>
                <span>Acompañamiento en tiempo real</span>
              </div>
            </div>
          </section>

          <section className="marathons-section" id="maratones">
            <div className="section-heading">
              <span className="eyebrow">Calendario</span>
              <h2>Próximas maratones</h2>
            </div>
            {marathonsError && <p className="error">No se pudieron cargar las maratones: {marathonsError}</p>}
            {!marathonsError && marathons.length === 0 ? (
              <div className="card state-card"><div className="state-icon">🏁</div><p>No hay maratones publicadas por el momento.</p></div>
            ) : (
              <div className="marathon-list">
                {marathons.map((item) => (
                  <article className="marathon-card" key={item.id}>
                    <div>
                      <span className="badge-status badge-confirmed">{item.registrationStatus || 'Publicada'}</span>
                      <h3>{item.name}</h3>
                      <p>{item.location || item.city || 'Ubicación por confirmar'}</p>
                      <p>{item.startsAt ? new Date(item.startsAt).toLocaleDateString() : item.date || 'Fecha por confirmar'}</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setSeccion('acceso')}>Inscribirme</button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="servicios">
            <div className="section-heading">
              <span className="eyebrow">Qué ofrecemos</span>
              <h2>Nuestras áreas de trabajo</h2>
            </div>
            <div className="cards">
              {SERVICIOS.map((s) => (
                <article className="card" key={s.title}>
                  <div className="icon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )
    }

    if (sesion.user.role === 'admin' || sesion.user.role === 'organizer') {
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