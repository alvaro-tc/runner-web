import { useEffect, useMemo, useState } from 'react'
import { Icon } from './components/AdminCharts'
import { getRoles, createRole, updateRole, deleteRole } from './api'
import { Modal, tono } from './PanelUsuarios'

// Un permiso sin el que lo abre no sirve: exportar sin ver inscritas, inscritas sin
// ver carreras… Marcar uno marca lo que necesita; desmarcar quita lo que dependía de él.
const NECESITA = {
  'carreras.editar': 'carreras.ver',
  'resumen.ver': 'carreras.ver',
  'inscritas.ver': 'carreras.ver',
  'inscritas.exportar': 'inscritas.ver',
  'cobros.validar': 'cobros.ver',
  'usuarios.gestionar': 'usuarios.ver',
  'roles.asignar': 'usuarios.gestionar',
  'roles.gestionar': 'usuarios.ver',
}

function alternar(actuales, p) {
  const s = new Set(actuales)
  if (s.has(p)) {
    const quitar = [p]
    while (quitar.length) {
      const x = quitar.pop()
      s.delete(x)
      Object.entries(NECESITA).forEach(([hijo, padre]) => { if (padre === x && s.has(hijo)) quitar.push(hijo) })
    }
  } else {
    for (let x = p; x; x = NECESITA[x]) s.add(x)
  }
  return [...s].sort()
}

const igual = (a, b) => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i])

const aClave = nombre => nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^(\d)/, 'r_$1').slice(0, 40)

export default function PanelRoles({ sesion }) {
  const token = sesion.accessToken
  const miRol = sesion.user.role
  const [datos, setDatos] = useState(null)
  const [borrador, setBorrador] = useState({})
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [modal, setModal] = useState(null) // { tipo: 'nuevo' } | { tipo: 'editar', rol }

  function aplicar(d) {
    setDatos(d)
    setBorrador(Object.fromEntries(d.roles.map(r => [r.key, r.permissions])))
  }

  useEffect(() => { getRoles(token).then(aplicar, e => setError(e.message)) }, [])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  // Filas de la matriz: todos los roles, la corredora al final (lo que se le dé lo reciben todas)
  const columnas = useMemo(() => [...(datos?.roles || [])].sort((a, b) => (a.key === 'runner') - (b.key === 'runner')), [datos])
  const cambiados = columnas.filter(r => !igual(borrador[r.key] || [], r.permissions))

  async function guardar() {
    setGuardando(true); setError('')
    try {
      let d = datos
      for (const r of cambiados) d = await updateRole(token, r.key, { permissions: borrador[r.key] })
      aplicar(d)
      setAviso(cambiados.length === 1 ? `Permisos de ${cambiados[0].name} guardados` : `${cambiados.length} roles actualizados`)
    } catch (e) { setError(e.message) }
    finally { setGuardando(false) }
  }

  if (!datos) return error
    ? <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>
    : <div className="ad-loading"><span className="ad-spinner" /> Cargando roles…</div>

  return (
    <div className="ad-mod ad-roles">
      <p className={`ad-toast${aviso ? ' is-on' : ''}`} role="status" aria-live="polite"><Icon name="check" size={16} />{aviso}</p>

      <header className="ad-head">
        <div>
          <p className="ad-eyebrow">Roles y permisos</p>
          <h1>Quién puede hacer qué</h1>
          <p className="ad-head-meta">Cada fila es un rol y cada columna un permiso, agrupados por módulo. Se aplica al guardar.</p>
        </div>
        <button className="ad-btn is-primary" onClick={() => setModal({ tipo: 'nuevo' })}><Icon name="plus" />Nuevo rol</button>
      </header>

      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}<button onClick={() => setError('')} aria-label="Cerrar aviso"><Icon name="x" size={16} /></button></p>}

      <div className="ad-rolelist">
        {datos.roles.map(r => (
          <button key={r.key} className="ad-rolechip" onClick={() => setModal({ tipo: 'editar', rol: r })}>
            <span className={`ad-tone is-${tono(r.key)}`} />
            <span className="ad-rolechip-txt"><strong>{r.name}</strong><small>{r.users} {r.users === 1 ? 'persona' : 'personas'} · {r.permissions.length} permisos</small></span>
            <Icon name="edit" size={14} />
          </button>
        ))}
      </div>

      <section className="ad-card ad-matrix-card">
        <div className="ad-matrix-wrap">
          <table className="ad-matrix">
            <thead>
              <tr>
                <th scope="col" rowSpan={2} className="ad-matrix-perm">Rol</th>
                {datos.modules.map(m => (
                  <th key={m.key} scope="colgroup" colSpan={m.permisos.length} className="ad-matrix-mod-h" title={m.description}>{m.name}</th>
                ))}
              </tr>
              <tr>
                {datos.modules.flatMap(m => m.permisos.map((p, i) => (
                  <th key={p.key} scope="col" className={`ad-matrix-p${i === 0 ? ' is-start' : ''}`} title={p.description}>{p.name}</th>
                )))}
              </tr>
            </thead>
            <tbody>
              {columnas.map(r => {
                const propio = r.key === miRol
                return (
                  <tr key={r.key} className={propio ? 'is-own' : ''}>
                    <th scope="row" className="ad-matrix-perm">
                      <span className="ad-matrix-role"><span className={`ad-tone is-${tono(r.key)}`} /><strong>{r.name}</strong></span>
                      <small>{propio ? 'Tu rol · lo edita otra persona' : r.key === 'runner' ? 'Aplica a todas las corredoras' : `${r.users} ${r.users === 1 ? 'persona' : 'personas'}`}</small>
                    </th>
                    {datos.modules.flatMap(m => m.permisos.map((p, i) => {
                      const on = (borrador[r.key] || []).includes(p.key)
                      return (
                        <td key={p.key} className={i === 0 ? 'is-start' : ''}>
                          <button type="button" role="checkbox" aria-checked={on} disabled={propio}
                            aria-label={`${p.name} (${m.name}) para ${r.name}`}
                            className={`ad-tick${on ? ' is-on' : ''}`}
                            onClick={() => setBorrador(b => ({ ...b, [r.key]: alternar(b[r.key] || [], p.key) }))}>
                            <Icon name="check" size={14} />
                          </button>
                        </td>
                      )
                    }))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="ad-matrix-note"><Icon name="shield" size={14} />Ningún rol tiene permisos fijos, tampoco Administrador. No podés editar tu propio rol, y siempre tiene que quedar alguien que pueda gestionar roles.</p>
      </section>

      <div className={`ad-savebar is-bare${cambiados.length ? ' is-dirty' : ''}`}>
        <span className="ad-savebar-state"><i />{cambiados.length ? `Cambios sin guardar en ${cambiados.map(r => r.name).join(', ')}` : 'Todo guardado'}</span>
        <button type="button" className="ad-btn is-ghost" disabled={!cambiados.length || guardando} onClick={() => aplicar(datos)}>Descartar</button>
        <button type="button" className="ad-btn is-primary" disabled={!cambiados.length || guardando} onClick={guardar}>{guardando ? 'Guardando…' : 'Guardar permisos'}</button>
      </div>

      {modal?.tipo === 'nuevo' && <ModalRol token={token} roles={datos.roles} onCerrar={() => setModal(null)} onListo={(d, msg) => { setModal(null); aplicar(d); setAviso(msg) }} />}
      {modal?.tipo === 'editar' && <ModalRol token={token} rol={modal.rol} roles={datos.roles} onCerrar={() => setModal(null)} onListo={(d, msg) => { setModal(null); aplicar(d); setAviso(msg) }} />}
    </div>
  )
}

function ModalRol({ token, rol, roles, onCerrar, onListo }) {
  const nuevo = !rol
  const [f, setF] = useState({ name: rol?.name || '', key: rol?.key || '', description: rol?.description || '', base: '' })
  const [claveTocada, setClaveTocada] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v, ...(k === 'name' && nuevo && !claveTocada ? { key: aClave(v) } : {}) }))

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      if (nuevo) {
        const permissions = roles.find(r => r.key === f.base)?.permissions || []
        onListo(await createRole(token, { key: f.key, name: f.name.trim(), description: f.description.trim() || undefined, permissions }), `Rol ${f.name.trim()} creado. Marcá sus permisos en la matriz.`)
      } else {
        onListo(await updateRole(token, rol.key, { name: f.name.trim(), description: f.description.trim() }), `Rol ${f.name.trim()} actualizado`)
      }
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar el rol "${rol.name}"?`)) return
    setGuardando(true); setError('')
    try { onListo(await deleteRole(token, rol.key), `Rol ${rol.name} borrado`) }
    catch (err) { setError(err.message); setGuardando(false) }
  }

  return (
    <Modal titulo={nuevo ? 'Nuevo rol' : `Rol ${rol.name}`} sub={nuevo ? 'Le das nombre ahora y los permisos en la matriz.' : rol.system ? 'Rol de serie: se puede renombrar, no borrar.' : null} onCerrar={onCerrar} onSubmit={guardar} pie={<>
      {!nuevo && !rol.system && <button type="button" className="ad-btn is-danger" style={{ marginRight: 'auto' }} disabled={guardando || rol.users > 0} title={rol.users > 0 ? 'Reasigná a sus personas antes de borrarlo' : undefined} onClick={borrar}><Icon name="trash" size={16} />Borrar</button>}
      <button type="button" className="ad-btn is-ghost" onClick={onCerrar}>Cancelar</button>
      <button className="ad-btn is-primary" disabled={guardando}>{guardando ? 'Guardando…' : nuevo ? 'Crear rol' : 'Guardar'}</button>
    </>}>
      <div className="ad-grid">
        <label className="ad-field"><span>Nombre</span><input required maxLength={60} autoFocus value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ej.: Veedor" /></label>
        <label className="ad-field"><span>Clave</span>
          <input required className="ad-mono" pattern="[a-z][a-z0-9_]{1,39}" title="Minúsculas, números y guion bajo" disabled={!nuevo} value={f.key} onChange={e => { setClaveTocada(true); set('key', e.target.value) }} />
          <small>{nuevo ? 'No se puede cambiar después.' : 'Fija.'}</small>
        </label>
        <label className="ad-field is-span"><span>Para qué sirve</span><input maxLength={240} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Ej.: Solo mira las inscritas, sin modificar nada" /></label>
        {nuevo && (
          <label className="ad-field is-span"><span>Empezar con los permisos de</span>
            <select value={f.base} onChange={e => set('base', e.target.value)}>
              <option value="">Ninguno (vacío)</option>
              {roles.filter(r => r.key !== 'runner').map(r => <option key={r.key} value={r.key}>{r.name}</option>)}
            </select>
          </label>
        )}
      </div>
      {!nuevo && rol.users > 0 && <p className="ad-hint"><Icon name="users" size={14} /> {rol.users} {rol.users === 1 ? 'persona tiene' : 'personas tienen'} este rol.</p>}
      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
    </Modal>
  )
}
