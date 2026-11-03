import { useEffect, useState } from 'react'
import { Icon } from './components/AdminCharts'
import { listUsers, createUser, updateUser, deleteUser, setUserPassword, getRoles } from './api'

const POR_PAGINA = 20
const fecha = iso => new Date(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })
const iniciales = n => (n || '?').split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()

// Tono fijo por rol para reconocerlo de un vistazo; los roles nuevos toman uno por su clave
const TONOS = ['violet', 'gold', 'ok', 'sky', 'rose', 'slate']
const TONO_FIJO = { admin: 'deep', runner: 'slate', organizer: 'gold', osi: 'violet', veedor: 'ok' }
const tono = key => TONO_FIJO[key] || TONOS[[...key].reduce((s, c) => s + c.charCodeAt(0), 0) % TONOS.length]

// Contraseña aleatoria que cumple la regla del backend: letras y al menos un dígito
function generarClave() {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
  const b = crypto.getRandomValues(new Uint8Array(12))
  return [...b.slice(0, 10)].map(x => letras[x % letras.length]).join('') + (b[10] % 10) + (b[11] % 10)
}

export default function PanelUsuarios({ sesion, puede }) {
  const token = sesion.accessToken
  const gestiona = puede('usuarios.gestionar')
  const asigna = puede('roles.asignar')
  const [roles, setRoles] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [total, setTotal] = useState(0)
  const [rol, setRol] = useState(asigna ? '' : 'runner')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [modal, setModal] = useState(null) // { tipo: 'cuenta' | 'clave' | 'eliminar', usuario? }

  const porClave = Object.fromEntries(roles.map(r => [r.key, r]))
  const nombreRol = k => porClave[k]?.name || k
  // Sin roles.asignar solo se atiende a corredoras: el backend tampoco deja más
  const puedeTocar = u => gestiona && (asigna || u.role === 'runner')

  async function cargar(p = page) {
    setCargando(true); setError('')
    try {
      const r = await listUsers(token, { q: q.trim(), role: rol, page: p, pageSize: POR_PAGINA })
      setUsuarios(r.data || [])
      setTotal(r.meta?.total || 0)
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  const cargarRoles = () => getRoles(token).then(r => setRoles(r.roles), e => setError(e.message))

  useEffect(() => { cargarRoles() }, [])
  useEffect(() => { cargar(page) }, [page, rol])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 4500)
    return () => clearTimeout(t)
  }, [aviso])

  function buscar(e) {
    e.preventDefault()
    if (page === 1) cargar(1); else setPage(1)
  }

  function listo(mensaje) {
    setModal(null); setAviso(mensaje)
    cargar(page); cargarRoles()
  }

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const visibles = asigna ? roles : roles.filter(r => r.key === 'runner')
  const todas = visibles.reduce((s, r) => s + r.users, 0)

  return (
    <div className="ad-mod">
      <p className={`ad-toast${aviso ? ' is-on' : ''}`} role="status" aria-live="polite"><Icon name="check" size={16} />{aviso}</p>

      <header className="ad-head">
        <div>
          <p className="ad-eyebrow">Usuarios</p>
          <h1>Cuentas</h1>
          <p className="ad-head-meta">{asigna ? 'Altas, roles, contraseñas y bajas de todo el equipo y las corredoras.' : 'Altas, contraseñas y bajas de las corredoras.'}</p>
        </div>
        {gestiona && <button className="ad-btn is-primary" onClick={() => setModal({ tipo: 'cuenta' })}><Icon name="userPlus" />Nueva cuenta</button>}
      </header>

      {visibles.length > 1 && (
        <div className="ad-chipbar" role="tablist" aria-label="Filtrar por rol">
          <button role="tab" aria-selected={rol === ''} className={`ad-chip${rol === '' ? ' is-on' : ''}`} onClick={() => { setRol(''); setPage(1) }}>
            Todas <b>{todas.toLocaleString('es-BO')}</b>
          </button>
          {visibles.map(r => (
            <button key={r.key} role="tab" aria-selected={rol === r.key} className={`ad-chip${rol === r.key ? ' is-on' : ''}`} onClick={() => { setRol(r.key); setPage(1) }}>
              <i className={`ad-tone is-${tono(r.key)}`} />{r.name} <b>{r.users.toLocaleString('es-BO')}</b>
            </button>
          ))}
        </div>
      )}

      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}

      <section className="ad-card ad-table-card">
        <header className="ad-card-head">
          <div><h2>{rol ? nombreRol(rol) : 'Todas las cuentas'} <span className="ad-count">{total.toLocaleString('es-BO')}</span></h2><p>Ordenadas de la más nueva a la más antigua.</p></div>
          <form className="ad-search" onSubmit={buscar} role="search">
            <Icon name="search" size={16} />
            <input type="search" placeholder="Nombre, email, CI o celular" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar cuenta" />
            <button className="ad-btn is-sm is-primary">Buscar</button>
          </form>
        </header>

        {cargando ? <div className="ad-skel ad-skel-table" /> : usuarios.length === 0 ? (
          <div className="ad-chart-empty"><Icon name="users" size={22} /><p>{q ? 'Ninguna cuenta coincide con esa búsqueda.' : 'No hay cuentas con este rol.'}</p></div>
        ) : (
          <>
            <div className="ad-table-wrap">
              <table className="ad-table ad-table-cards">
                <thead><tr><th>Persona</th><th>CI</th><th>Rol</th><th>Estado</th><th>Alta</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                <tbody>
                  {usuarios.map(u => {
                    const yo = u.id === sesion.user.id
                    return (
                      <tr key={u.id}>
                        <td><div className="ad-person"><span className="ad-avatar" aria-hidden="true">{iniciales(u.name)}</span><div><div className="cell-name">{u.name}{yo && <span className="ad-you">vos</span>}</div><div className="cell-sub">{u.email || 'Sin email'}</div></div></div></td>
                        <td data-l="CI">{u.ci || '—'}</td>
                        <td data-l="Rol"><span className={`ad-role is-${tono(u.role)}`}>{nombreRol(u.role)}</span></td>
                        <td data-l="Estado">
                          {!u.verified ? <span className="ad-pill is-warn">Sin verificar</span>
                            : u.mustChangePassword ? <span className="ad-pill is-gold">Debe cambiar clave</span>
                            : <span className="ad-pill is-ok">Activa</span>}
                        </td>
                        <td data-l="Alta">{fecha(u.createdAt)}</td>
                        <td className="ad-row-actions">
                          {puedeTocar(u) && <>
                            <button className="ad-icon-btn" onClick={() => setModal({ tipo: 'cuenta', usuario: u })} aria-label={`Editar a ${u.name}`} title="Editar"><Icon name="edit" size={16} /></button>
                            <button className="ad-icon-btn" onClick={() => setModal({ tipo: 'clave', usuario: u })} aria-label={`Contraseña de ${u.name}`} title="Contraseña"><Icon name="key" size={16} /></button>
                            {!yo && <button className="ad-icon-btn is-danger" onClick={() => setModal({ tipo: 'eliminar', usuario: u })} aria-label={`Eliminar a ${u.name}`} title="Eliminar"><Icon name="trash" size={16} /></button>}
                          </>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <footer className="ad-pager">
              <span>Página <b>{page}</b> de {paginas}</span>
              <div>
                <button className="ad-icon-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Página anterior"><Icon name="chevron" style={{ transform: 'rotate(90deg)' }} /></button>
                <button className="ad-icon-btn" disabled={page >= paginas} onClick={() => setPage(p => p + 1)} aria-label="Página siguiente"><Icon name="chevron" style={{ transform: 'rotate(-90deg)' }} /></button>
              </div>
            </footer>
          </>
        )}
      </section>

      {modal?.tipo === 'cuenta' && <ModalCuenta token={token} usuario={modal.usuario} yo={modal.usuario?.id === sesion.user.id} roles={asigna ? roles : roles.filter(r => r.key === 'runner')} onCerrar={() => setModal(null)} onListo={listo} />}
      {modal?.tipo === 'clave' && <ModalClave token={token} usuario={modal.usuario} onCerrar={() => setModal(null)} onListo={listo} />}
      {modal?.tipo === 'eliminar' && <ModalEliminar token={token} usuario={modal.usuario} onCerrar={() => setModal(null)} onListo={listo} />}
    </div>
  )
}

export function Modal({ titulo, sub, onCerrar, children, onSubmit, pie, ancho }) {
  useEffect(() => {
    const esc = e => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [])
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className={`modal ad-modal${ancho ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={titulo} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><div><h2>{titulo}</h2>{sub && <p className="ad-hint">{sub}</p>}</div><button type="button" className="modal-close" onClick={onCerrar} aria-label="Cerrar">×</button></div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">{pie}</div>
        </form>
      </div>
    </div>
  )
}

function ModalCuenta({ token, usuario, yo, roles, onCerrar, onListo }) {
  const nuevo = !usuario
  const [f, setF] = useState({
    name: usuario?.name || '', email: usuario?.email || '', role: usuario?.role || 'runner',
    verified: usuario?.verified ?? true, password: nuevo ? generarClave() : '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      if (nuevo) {
        await createUser(token, { name: f.name.trim(), email: f.email.trim(), role: f.role, verified: f.verified, password: f.password })
        onListo(`Cuenta creada para ${f.email.trim()}. Pasale la contraseña por un canal privado.`)
      } else {
        const cambios = {}
        if (f.name.trim() !== usuario.name) cambios.name = f.name.trim()
        if (f.email.trim() !== (usuario.email || '')) cambios.email = f.email.trim()
        if (f.role !== usuario.role) cambios.role = f.role
        if (f.verified !== usuario.verified) cambios.verified = f.verified
        if (Object.keys(cambios).length) await updateUser(token, usuario.id, cambios)
        onListo(`Cuenta de ${f.name.trim()} actualizada`)
      }
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  return (
    <Modal titulo={nuevo ? 'Nueva cuenta' : `Editar a ${usuario.name}`} sub={nuevo ? 'Elegí el rol: define qué módulos ve en el panel.' : null} onCerrar={onCerrar} onSubmit={guardar} ancho pie={<>
      <button type="button" className="ad-btn is-ghost" onClick={onCerrar}>Cancelar</button>
      <button className="ad-btn is-primary" disabled={guardando}>{guardando ? 'Guardando…' : nuevo ? 'Crear cuenta' : 'Guardar cambios'}</button>
    </>}>
      <div className="ad-grid">
        <label className="ad-field"><span>Nombre</span><input required maxLength={120} autoFocus placeholder="Ej.: Ana Quispe" value={f.name} onChange={e => set('name', e.target.value)} /></label>
        <label className="ad-field"><span>Email</span><input type="email" required={nuevo} maxLength={254} placeholder="ana@correo.com" value={f.email} onChange={e => set('email', e.target.value)} /></label>
      </div>

      {roles.length > 1 && (
        <fieldset className="ad-rolepick" disabled={yo}>
          <legend>Rol{yo && <small> · no podés cambiar tu propio rol</small>}</legend>
          {roles.map(r => (
            <label key={r.key} className={`ad-rolecard${f.role === r.key ? ' is-on' : ''}`}>
              <input type="radio" name="role" value={r.key} checked={f.role === r.key} onChange={() => set('role', r.key)} />
              <span className={`ad-tone is-${tono(r.key)}`} />
              <strong>{r.name}</strong>
              <small>{r.description || `${r.permissions.length} permisos`}</small>
            </label>
          ))}
        </fieldset>
      )}

      <label className="ad-check"><input type="checkbox" checked={f.verified} onChange={e => set('verified', e.target.checked)} /> Email verificado</label>

      {nuevo && (
        <label className="ad-field"><span>Contraseña inicial</span>
          <span className="ad-pass">
            <input className="ad-mono" required minLength={8} maxLength={128} pattern="(?=.*[A-Za-z])(?=.*\d).{8,}" title="Al menos 8 caracteres, con letras y un número" value={f.password} onChange={e => set('password', e.target.value)} />
            <button type="button" className="ad-icon-btn" onClick={() => set('password', generarClave())} aria-label="Generar otra" title="Generar otra"><Icon name="refresh" size={16} /></button>
          </span>
        </label>
      )}
      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
    </Modal>
  )
}

function ModalClave({ token, usuario, onCerrar, onListo }) {
  const [clave, setClave] = useState(generarClave)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [copiada, setCopiada] = useState(false)

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      const r = await setUserPassword(token, usuario.id, clave)
      onListo(`Contraseña de ${usuario.name} cambiada. Se cerraron ${r?.sessionsRevoked ?? 0} sesiones.`)
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  return (
    <Modal titulo={`Contraseña de ${usuario.name}`} sub="Se cierran todas sus sesiones. Copiala antes de guardar y pasásela por un canal privado." onCerrar={onCerrar} onSubmit={guardar} pie={<>
      <button type="button" className="ad-btn is-ghost" onClick={onCerrar}>Cancelar</button>
      <button className="ad-btn is-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Cambiar contraseña'}</button>
    </>}>
      <label className="ad-field"><span>Nueva contraseña</span>
        <span className="ad-pass">
          <input className="ad-mono" required minLength={8} maxLength={128} pattern="(?=.*[A-Za-z])(?=.*\d).{8,}" title="Al menos 8 caracteres, con letras y un número" value={clave} onChange={e => { setClave(e.target.value); setCopiada(false) }} />
          <button type="button" className="ad-icon-btn" onClick={() => navigator.clipboard?.writeText(clave).then(() => setCopiada(true), () => {})} aria-label="Copiar" title="Copiar"><Icon name={copiada ? 'check' : 'copy'} size={16} /></button>
          <button type="button" className="ad-icon-btn" onClick={() => { setClave(generarClave()); setCopiada(false) }} aria-label="Generar otra" title="Generar otra"><Icon name="refresh" size={16} /></button>
        </span>
      </label>
      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
    </Modal>
  )
}

function ModalEliminar({ token, usuario, onCerrar, onListo }) {
  const clave = usuario.email || usuario.name
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function eliminar(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try { await deleteUser(token, usuario.id); onListo(`Cuenta de ${usuario.name} eliminada`) }
    catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  return (
    <Modal titulo={`Eliminar a ${usuario.name}`} sub={`No se puede deshacer.${usuario.registrations > 0 ? ` Tiene ${usuario.registrations} inscripción(es).` : ''}`} onCerrar={onCerrar} onSubmit={eliminar} pie={<>
      <button type="button" className="ad-btn is-ghost" onClick={onCerrar}>Cancelar</button>
      <button className="ad-btn is-danger" disabled={guardando || texto.trim() !== clave}>{guardando ? 'Eliminando…' : 'Eliminar cuenta'}</button>
    </>}>
      <label className="ad-field"><span>Para confirmar escribí <b>{clave}</b></span>
        <input autoFocus value={texto} onChange={e => setTexto(e.target.value)} />
      </label>
      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
    </Modal>
  )
}

export { tono }
