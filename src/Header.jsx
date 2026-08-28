import { useState, useEffect } from 'react'

export default function Header({ sesion, onLogout, onSeccionChange }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function irAcceso() {
    onSeccionChange?.('acceso')
    setMenuOpen(false)
  }

  return (
    <header className={`topbar${scrolled ? ' topbar-scrolled' : ''}`} id="top">
      <div className="topbar-inner container">
        <a className="brand" href="#top" onClick={e => { e.preventDefault(); onSeccionChange?.('inicio') }}>
          <img className="brand-icon" src="/logo.png" alt="CAM" />
          <div className="brand-text">
            <strong>CAM</strong>
            <span>Maratón de la Mujer</span>
          </div>
        </a>

        {!sesion && (
          <nav className={`topbar-nav${menuOpen ? ' nav-open' : ''}`}>
            <a href="#nosotras" onClick={() => setMenuOpen(false)}>Nosotras</a>
            <a href="#carreras" onClick={() => setMenuOpen(false)}>Carreras</a>
            <a href="#recursos" onClick={() => setMenuOpen(false)}>Recursos</a>
            <a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
          </nav>
        )}

        <div className="topbar-actions">
          {sesion ? (
            <>
              <span className={`role-badge ${sesion.user.role === 'admin' ? 'badge-admin' : 'badge-runner'}`}>
                {sesion.user.role === 'admin' ? '⚙️ Admin' : '🏃‍♀️ Corredora'}
              </span>
              <span className="user-name">{sesion.user.name}</span>
              <button className="btn-ghost-sm" onClick={onLogout}>Salir</button>
            </>
          ) : (
            <>
              <button className="btn-outline-sm" onClick={irAcceso}>Iniciar sesión</button>
              <button className="btn-primary-sm" onClick={irAcceso}>Registrarse</button>
            </>
          )}
        </div>

        {!sesion && (
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menú"
          >
            <span /><span /><span />
          </button>
        )}
      </div>
    </header>
  )
}
