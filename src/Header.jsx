import { useState } from 'react'
import { esStaff, etiquetaRol } from './roles'

export default function Header({ sesion, onLogout, onSeccionChange }) {
  const [menuOpen, setMenuOpen] = useState(false)

  function irInicio() {
    onSeccionChange?.('inicio')
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function irAcceso() {
    onSeccionChange?.('acceso')
    setMenuOpen(false)
  }

  function irRegistro() {
    onSeccionChange?.('registro')
    setMenuOpen(false)
  }

  // Esta función hace la magia de devolverte al inicio y scrollear a la sección correcta
  function handleNavClick(e, id) {
    e.preventDefault()
    
    // 1. Le decimos a App.jsx que cargue la vista principal ('inicio')
    onSeccionChange?.('inicio')
    setMenuOpen(false)
    
    // 2. Esperamos un instante a que React dibuje la página y hacemos el scroll
    setTimeout(() => {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100) // 100ms es suficiente para que React cargue los componentes
  }

  return (
    // Aplicamos el color de fondo personalizado que pediste
    <header className="topbar topbar-scrolled" id="top" style={{ backgroundColor: '#FAD047' }}>
      <div className="topbar-inner container">
        
        <a className="brand" href="#top" onClick={e => { e.preventDefault(); irInicio() }}>
          {/* Quitamos el filtro blanco para que el logo se vea original sobre el fondo crema */}
          <img className="brand-icon" src="/logo.png" alt="CAM" />
          <div className="brand-text">
            <strong style={{ color: 'var(--purple)' }}>CAM</strong>
            <span style={{ color: 'var(--dark)' }}>Maratón de la Mujer</span>
          </div>
        </a>

        {!sesion && (
          <nav className={`topbar-nav${menuOpen ? ' nav-open' : ''}`}>
            {/* La casita ahora es parte del menú, alineada y con el mismo estilo */}
            <a 
              href="#top" 
              onClick={(e) => handleNavClick(e, 'top')}
              title="Volver al inicio"
              style={{ display: 'flex', alignItems: 'center', padding: '0.45rem 0.5rem' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </a>
            <a href="#nosotras" onClick={(e) => handleNavClick(e, 'nosotras')}>Nuestra Labor</a>
            <a href="#carreras" onClick={(e) => handleNavClick(e, 'carreras')}>Modalidades</a>
            <a href="#recursos" onClick={(e) => handleNavClick(e, 'recursos')}>Recursos</a>
            <a href="#contacto" onClick={(e) => handleNavClick(e, 'contacto')}>Contacto</a>
          </nav>
        )}

        <div className="topbar-actions">
          {sesion ? (
            <>
              <span className={`role-badge ${esStaff(sesion.user.role) ? 'badge-admin' : 'badge-runner'}`}>
                {etiquetaRol(sesion.user.role)}
              </span>
              <span className="user-name" style={{ color: 'var(--dark)' }}>{sesion.user.name}</span>
              <button className="btn-ghost-sm" onClick={onLogout} style={{ color: 'var(--dark)', borderColor: 'var(--gray)' }}>Salir</button>
            </>
          ) : (
            <>
              {/* Botones vuelven a usar los estilos base para que contrasten bien */}
              <button className="btn-outline-sm" onClick={irAcceso}>Iniciar sesión</button>
              <button className="btn-primary-sm" onClick={irRegistro}>Registrarse</button>
            </>
          )}
        </div>

        {!sesion && (
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menú"
          >
            {/* Rayas oscuras para el menú de celular */}
            <span style={{ backgroundColor: 'var(--dark)' }} />
            <span style={{ backgroundColor: 'var(--dark)' }} />
            <span style={{ backgroundColor: 'var(--dark)' }} />
          </button>
        )}
      </div>
    </header>
  )
}