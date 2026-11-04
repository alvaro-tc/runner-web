import { useEffect, useState } from 'react'
import { Icon } from './components/AdminCharts'
import PanelCarreras from './PanelCarreras'
import PanelCobros from './PanelCobros'
import PanelUsuarios from './PanelUsuarios'
import PanelRoles from './PanelRoles'
import PanelAuditoria from './PanelAuditoria'
import PanelPlataforma from './PanelPlataforma'
import PanelPerfil from './PanelPerfil'
import { getMyAccess } from './api'
import './admin.css'

// Un solo panel para todo el equipo. Cada módulo aparece si el rol tiene su permiso
// de entrada; dentro, cada módulo esconde lo que el rol no puede tocar.
const MODULOS = [
  { key: 'carreras', label: 'Carreras', icon: 'flag', permiso: 'carreras.ver', Vista: PanelCarreras },
  { key: 'cobros', label: 'Cobros', icon: 'receipt', permiso: 'cobros.ver', Vista: PanelCobros },
  { key: 'usuarios', label: 'Usuarios', icon: 'users', permiso: 'usuarios.ver', Vista: PanelUsuarios },
  { key: 'roles', label: 'Roles y permisos', corto: 'Roles', icon: 'key', permiso: 'roles.gestionar', Vista: PanelRoles },
  { key: 'auditoria', label: 'Auditoría', icon: 'shield', permiso: 'auditoria.ver', Vista: PanelAuditoria },
  { key: 'plataforma', label: 'Plataforma', icon: 'qr', permiso: 'plataforma.gestionar', Vista: PanelPlataforma },
]

const iniciales = n => (n || '?').split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()

function leerModulo() {
  try { return localStorage.getItem('admin.modulo') || '' } catch { return '' }
}

export default function PanelAdmin({ sesion, onLogout }) {
  const token = sesion.accessToken
  const [acceso, setAcceso] = useState(null)
  const [error, setError] = useState('')
  const [modulo, setModulo] = useState(leerModulo)

  useEffect(() => {
    getMyAccess(token).then(setAcceso, e => setError(e.message))
  }, [])

  const permisos = acceso?.permissions || []
  const puede = p => permisos.includes(p)
  const visibles = MODULOS.filter(m => puede(m.permiso))
  const enPerfil = modulo === 'perfil' // el perfil no es un módulo con permiso: todo rol lo tiene
  const actual = enPerfil ? { key: 'perfil', Vista: PanelPerfil } : visibles.find(m => m.key === modulo) || visibles[0]

  function elegir(k) {
    setModulo(k)
    try { localStorage.setItem('admin.modulo', k) } catch {}
    window.scrollTo({ top: 0 })
  }

  const [yo, setYo] = useState(null)
  const nombre = yo?.name || acceso?.user?.name || sesion.user.name
  const avatar = yo?.profile?.avatarUrl

  return (
    <div className="ad">
      <aside className="ad-side">
        <a className="ad-brand" href="/" onClick={e => e.preventDefault()}>
          <img src="/logo.png" alt="" />
          <span><strong>CAM RUN</strong><small>Panel de gestión</small></span>
        </a>

        {visibles.length > 0 && (
          <nav className="ad-nav" aria-label="Módulos">
            <p className="ad-side-label">Módulos</p>
            {visibles.map(m => (
              <button key={m.key} className={`ad-nav-item${actual?.key === m.key ? ' is-on' : ''}`} aria-current={actual?.key === m.key ? 'page' : undefined} onClick={() => elegir(m.key)}>
                <Icon name={m.icon} /><span className="ad-nav-l" data-corto={m.corto || m.label}>{m.label}</span>
              </button>
            ))}
          </nav>
        )}

        <div className="ad-me">
          <button className="ad-person" style={{ flex: 1, minWidth: 0, textAlign: 'left' }} onClick={() => elegir('perfil')} aria-label="Mi perfil" aria-current={enPerfil ? 'page' : undefined}>
            {avatar ? <img className="ad-avatar" src={avatar} alt="" style={{ objectFit: 'cover' }} /> : <span className="ad-avatar" aria-hidden="true">{iniciales(nombre)}</span>}
            <span className="ad-me-txt"><strong>{nombre}</strong><small>{acceso?.roleName || '…'}</small></span>
          </button>
          <button className="ad-icon-btn" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" /></button>
        </div>
      </aside>

      <main className="ad-main">
        {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
        {!acceso && !error && <div className="ad-loading"><span className="ad-spinner" /> Cargando tu acceso…</div>}
        {acceso && !actual && (
          <div className="ad-card ad-empty">
            <span className="ad-empty-ic"><Icon name="lock" size={28} /></span>
            <h2>Tu rol todavía no tiene módulos</h2>
            <p>Pedile a quien administra los roles que le asigne permisos a <b>{acceso.roleName}</b>.</p>
          </div>
        )}
        {actual && <actual.Vista key={actual.key} sesion={sesion} puede={puede} onMe={setYo} />}
      </main>
    </div>
  )
}
