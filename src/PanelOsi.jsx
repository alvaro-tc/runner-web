import { useEffect, useState } from 'react'
import { listUsers, createUser, updateUser, deleteUser, setUserPassword } from './api'
import { ROL_LABEL } from './roles'

// El OSI administra todas las cuentas menos las de admin: el backend ni se las lista.
const ROLES = ['runner', 'organizer', 'osi']
const POR_PAGINA = 20

const QUE_HACE = {
  runner: 'Se inscribe y corre desde la app.',
  organizer: 'Valida cobros y ve las inscritas.',
  osi: 'Administra las cuentas, como vos.',
}

// Contraseña aleatoria que cumple la regla del backend: letras y al menos un digito
function generarClave() {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const base = [...bytes.slice(0, 10)].map(b => letras[b % letras.length]).join('')
  return base + String(bytes[10] % 10) + String(bytes[11] % 10)
}

const fecha = iso => new Date(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })

export default function PanelOsi({ sesion }) {
  const token = sesion.accessToken
  const [usuarios, setUsuarios] = useState([])
  const [total, setTotal] = useState(0)
  const [conteo, setConteo] = useState({})
  const [rol, setRol] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [modal, setModal] = useState(null) // { tipo: 'nuevo' | 'editar' | 'clave' | 'eliminar', usuario? }

  async function cargar(p = page) {
    setCargando(true); setError('')
    try {
      const r = await listUsers(token, { q: q.trim(), role: rol, page: p, pageSize: POR_PAGINA })
      setUsuarios(r.data || [])
      setTotal(r.meta?.total || 0)
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  // Un pedido por rol con pageSize 1: solo interesa meta.total
  async function contar() {
    const totales = await Promise.all(ROLES.map(r => listUsers(token, { role: r, pageSize: 1 }).then(x => x.meta?.total || 0, () => null)))
    setConteo(Object.fromEntries(ROLES.map((r, i) => [r, totales[i]])))
  }

  useEffect(() => { contar() }, [])
  useEffect(() => { cargar(page) }, [page, rol])

  function buscar(e) {
    e.preventDefault()
    if (page === 1) cargar(1); else setPage(1)
  }

  function elegirRol(r) {
    setRol(r); setPage(1)
  }

  function listo(mensaje) {
    setModal(null)
    setAviso(mensaje)
    cargar(page)
    contar()
  }

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const todas = ROLES.reduce((s, r) => s + (conteo[r] || 0), 0)

  return (
    <div className="dashboard osi">
      <header className="pc-band">
        <div className="container osi-band-in">
          <div>
            <h1 className="osi-title">Cuentas</h1>
            <p className="osi-sub">Altas, roles, contraseñas y bajas. Las cuentas de admin no se gestionan desde acá.</p>
          </div>
          <button className="pc-new" onClick={() => setModal({ tipo: 'nuevo' })}>Nueva cuenta</button>
        </div>
      </header>

      <div className="container dashboard-body">
        <div className="osi-roles" role="tablist" aria-label="Filtrar por rol">
          <button role="tab" aria-selected={rol === ''} className={`osi-role${rol === '' ? ' is-on' : ''}`} onClick={() => elegirRol('')}>
            <span className="osi-role-n">{todas.toLocaleString('es-BO')}</span>
            <span>Todas las cuentas</span>
          </button>
          {ROLES.map(r => (
            <button key={r} role="tab" aria-selected={rol === r} className={`osi-role osi-role-${r}${rol === r ? ' is-on' : ''}`} onClick={() => elegirRol(r)}>
              <span className="osi-role-n">{conteo[r] == null ? '—' : conteo[r].toLocaleString('es-BO')}</span>
              <span>{ROL_LABEL[r]}{r === 'runner' ? 's' : r === 'organizer' ? 'es' : ''}</span>
            </button>
          ))}
        </div>

        {aviso && <p className="osi-ok" role="status">{aviso} <button className="pc-link" onClick={() => setAviso('')}>Cerrar</button></p>}
        {error && <p className="dash-error" role="alert">{error}</p>}

        <div className="dash-card">
          <div className="dash-card-header">
            <h2>{rol ? ROL_LABEL[rol] : 'Todas'} ({total.toLocaleString('es-BO')})</h2>
            <form className="dash-search-bar" onSubmit={buscar}>
              <input type="search" className="dash-search-input" placeholder="Nombre, email, CI o celular" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar cuenta" />
              <button className="btn-outline-sm">Buscar</button>
            </form>
          </div>

          {cargando ? <div className="dash-loading">Cargando…</div> : usuarios.length === 0 ? (
            <div className="dash-empty">
              <p>{q ? 'Ninguna cuenta coincide con esa búsqueda.' : 'No hay cuentas con este rol.'}</p>
              {!q && <button className="btn-primary-sm" onClick={() => setModal({ tipo: 'nuevo' })}>Crear una cuenta</button>}
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="dash-table osi-table">
                  <thead><tr><th>Persona</th><th>CI</th><th>Rol</th><th>Estado</th><th>Alta</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                  <tbody>
                    {usuarios.map(u => {
                      const yo = u.id === sesion.user.id
                      return (
                        <tr key={u.id}>
                          <td><div className="cell-name">{u.name}{yo && <span className="osi-you">vos</span>}</div><div className="cell-sub">{u.email || 'Sin email'}</div></td>
                          <td>{u.ci || '—'}</td>
                          <td><span className={`osi-pill osi-pill-${u.role}`}>{ROL_LABEL[u.role] || u.role}</span></td>
                          <td>
                            {!u.verified ? <span className="status-badge badge-pending">Sin verificar</span>
                              : u.mustChangePassword ? <span className="status-badge badge-draft">Debe cambiar clave</span>
                              : <span className="status-badge badge-confirmed">Activa</span>}
                            {u.registrations > 0 && <div className="cell-sub">{u.registrations} inscripción{u.registrations > 1 ? 'es' : ''}</div>}
                          </td>
                          <td>{fecha(u.createdAt)}</td>
                          <td className="actions-cell">
                            <button className="btn-outline-sm" onClick={() => setModal({ tipo: 'editar', usuario: u })}>Editar</button>
                            <button className="btn-outline-sm" onClick={() => setModal({ tipo: 'clave', usuario: u })}>Contraseña</button>
                            {!yo && <button className="btn-danger-sm" onClick={() => setModal({ tipo: 'eliminar', usuario: u })}>Eliminar</button>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button className="btn-outline-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Página anterior">←</button>
                <span>Página {page} de {paginas}</span>
                <button className="btn-outline-sm" disabled={page >= paginas} onClick={() => setPage(p => p + 1)} aria-label="Página siguiente">→</button>
              </div>
            </>
          )}
        </div>
      </div>

      {(modal?.tipo === 'nuevo' || modal?.tipo === 'editar') && (
        <ModalCuenta token={token} usuario={modal.usuario} yo={modal.usuario?.id === sesion.user.id} onCerrar={() => setModal(null)} onListo={listo} />
      )}
      {modal?.tipo === 'clave' && <ModalClave token={token} usuario={modal.usuario} onCerrar={() => setModal(null)} onListo={listo} />}
      {modal?.tipo === 'eliminar' && <ModalEliminar token={token} usuario={modal.usuario} onCerrar={() => setModal(null)} onListo={listo} />}
    </div>
  )
}

function Modal({ titulo, onCerrar, children, onSubmit, pie }) {
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{titulo}</h2><button className="modal-close" onClick={onCerrar} aria-label="Cerrar">×</button></div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">{pie}</div>
        </form>
      </div>
    </div>
  )
}

function ModalCuenta({ token, usuario, yo, onCerrar, onListo }) {
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
    <Modal titulo={nuevo ? 'Nueva cuenta' : `Editar a ${usuario.name}`} onCerrar={onCerrar} onSubmit={guardar} pie={<>
      <button type="button" className="btn-ghost-sm" onClick={onCerrar}>Cancelar</button>
      <button className="btn-primary-sm" disabled={guardando}>{guardando ? 'Guardando…' : nuevo ? 'Crear cuenta' : 'Guardar cambios'}</button>
    </>}>
      <label className="form-label">Nombre<input className="form-input" required maxLength={120} autoFocus value={f.name} onChange={e => set('name', e.target.value)} /></label>
      <label className="form-label">Email<input className="form-input" type="email" required={nuevo} maxLength={254} value={f.email} onChange={e => set('email', e.target.value)} /></label>

      <fieldset className="osi-rolepick" disabled={yo}>
        <legend className="form-label">Rol{yo && ' (no podés cambiar tu propio rol)'}</legend>
        {ROLES.map(r => (
          <label key={r} className={`osi-rolecard${f.role === r ? ' is-on' : ''}`}>
            <input type="radio" name="role" value={r} checked={f.role === r} onChange={() => set('role', r)} />
            <strong>{ROL_LABEL[r]}</strong>
            <span>{QUE_HACE[r]}</span>
          </label>
        ))}
      </fieldset>

      <label className="osi-check"><input type="checkbox" checked={f.verified} onChange={e => set('verified', e.target.checked)} /> Email verificado</label>

      {nuevo && (
        <label className="form-label">Contraseña inicial
          <span className="osi-pass">
            <input className="form-input" required minLength={8} maxLength={128} pattern="(?=.*[A-Za-z])(?=.*\d).{8,}" title="Al menos 8 caracteres, con letras y un número" value={f.password} onChange={e => set('password', e.target.value)} />
            <button type="button" className="btn-outline-sm" onClick={() => set('password', generarClave())}>Generar otra</button>
          </span>
        </label>
      )}
      {error && <p className="dash-error">{error}</p>}
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
      onListo(`Contraseña de ${usuario.name} cambiada. Se cerraron ${r?.sessionsRevoked ?? 0} sesiones abiertas.`)
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  function copiar() {
    navigator.clipboard?.writeText(clave).then(() => setCopiada(true), () => {})
  }

  return (
    <Modal titulo={`Contraseña de ${usuario.name}`} onCerrar={onCerrar} onSubmit={guardar} pie={<>
      <button type="button" className="btn-ghost-sm" onClick={onCerrar}>Cancelar</button>
      <button className="btn-primary-sm" disabled={guardando}>{guardando ? 'Guardando…' : 'Cambiar contraseña'}</button>
    </>}>
      <p className="pc-hint" style={{ marginBottom: '1rem' }}>Se cierran todas sus sesiones abiertas. Copiá la contraseña antes de guardar y pasásela por un canal privado.</p>
      <label className="form-label">Nueva contraseña
        <span className="osi-pass">
          <input className="form-input osi-mono" required minLength={8} maxLength={128} pattern="(?=.*[A-Za-z])(?=.*\d).{8,}" title="Al menos 8 caracteres, con letras y un número" value={clave} onChange={e => { setClave(e.target.value); setCopiada(false) }} />
          <button type="button" className="btn-outline-sm" onClick={copiar}>{copiada ? 'Copiada' : 'Copiar'}</button>
          <button type="button" className="btn-outline-sm" onClick={() => { setClave(generarClave()); setCopiada(false) }}>Generar otra</button>
        </span>
      </label>
      {error && <p className="dash-error">{error}</p>}
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
    <Modal titulo={`Eliminar a ${usuario.name}`} onCerrar={onCerrar} onSubmit={eliminar} pie={<>
      <button type="button" className="btn-ghost-sm" onClick={onCerrar}>Cancelar</button>
      <button className="btn-danger-sm" disabled={guardando || texto.trim() !== clave}>{guardando ? 'Eliminando…' : 'Eliminar cuenta'}</button>
    </>}>
      <p style={{ marginBottom: '1rem' }}>
        No se puede deshacer.{usuario.registrations > 0 && ` Tiene ${usuario.registrations} inscripción${usuario.registrations > 1 ? 'es' : ''} `}
      </p>
      <label className="form-label">Para confirmar escribí <strong>{clave}</strong>
        <input className="form-input" autoFocus value={texto} onChange={e => setTexto(e.target.value)} />
      </label>
      {error && <p className="dash-error">{error}</p>}
    </Modal>
  )
}
