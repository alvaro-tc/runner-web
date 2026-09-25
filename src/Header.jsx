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

      {sesion ? (
        <div className="user">
          <span className="role-badge">
            {sesion.user.role === 'admin' ? 'Admin' : sesion.user.role === 'organizer' ? 'Organizador' : 'Corredor/a'}
          </span>
          <span>{sesion.user.name}</span>
          <button className="btn-logout" onClick={onLogout}>Salir</button>
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