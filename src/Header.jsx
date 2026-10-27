import { useEffect, useState } from 'react'
import { esStaff, etiquetaRol } from './roles'

const LINKS = [
  ['el-dia', 'La carrera'],
  ['causa', 'La causa'],
  ['pasadas', 'Eventos'],
  ['preguntas', 'Preguntas'],
]

export default function Header({ sesion, onLogout, seccion, onSeccionChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Sobre el hero la barra es translúcida; al bajar, en login y en paneles va blanca.
  const enLanding = !sesion && seccion === 'inicio'
  const clara = !enLanding || scrolled || menuOpen

  function ir(nuevaSeccion) {
    onSeccionChange?.(nuevaSeccion)
    setMenuOpen(false)
  }

  // Vuelve a la portada (si estabas en login) y baja a la sección pedida
  function handleNavClick(e, id) {
    e.preventDefault()
    ir('inicio')
    setTimeout(() => {
      if (id === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
      else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <header className={`lp-nav${clara ? ' clara' : ''}`}>
      <div className="lp-nav-bar">
        <a className="lp-brand" href="/" onClick={e => handleNavClick(e, 'top')}>
          <img src="/logo.png" alt="" />CAM RUN
        </a>

        {!sesion && (
          <nav className={`lp-links${menuOpen ? ' open' : ''}`} aria-label="Secciones">
            {LINKS.map(([id, texto]) => (
              <a key={id} href={`#${id}`} onClick={e => handleNavClick(e, id)}>{texto}</a>
            ))}
            <button className="lp-login lp-login-menu" onClick={() => ir('acceso')}>Iniciar sesión</button>
          </nav>
        )}

        <div className="lp-actions">
          {sesion ? (
            <>
              <span className={`role-badge ${esStaff(sesion.user.role) ? 'badge-admin' : 'badge-runner'}`}>
                {etiquetaRol(sesion.user.role)}
              </span>
              <span className="lp-user">{sesion.user.name}</span>
              <button className="lp-login lp-salir" onClick={onLogout}>Salir</button>
            </>
          ) : (
            <>
              <button className="lp-login" onClick={() => ir('acceso')}>Ingresar</button>
              <button className="btn btn-main" onClick={() => ir('inscribirme')}>Inscribirme</button>
            </>
          )}
          {!sesion && (
            <button
              className={`lp-burger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menú"
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
