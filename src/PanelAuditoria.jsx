import { Fragment, useEffect, useState } from 'react'
import { Icon } from './components/AdminCharts'
import { getAudit } from './api'
import { tono } from './PanelUsuarios'

// Ruta del backend → frase legible. Lo que no esté acá se muestra tal cual (método + ruta).
const ACCIONES = [
  ['POST', '/admin/marathons', 'Creó una carrera'],
  ['PUT', '/admin/marathons/:id', 'Editó una carrera'],
  ['DELETE', '/admin/marathons/:id', 'Eliminó una carrera'],
  ['POST', '/admin/marathons/:id/publish', 'Publicó una carrera'],
  ['POST', '/admin/marathons/:id/unpublish', 'Ocultó una carrera'],
  ['POST', '/admin/marathons/:id/qr', 'Cambió el QR de cobro'],
  ['POST', '/admin/marathons/:id/cover', 'Cambió el afiche'],
  ['POST', '/admin/marathons/:id/logo/:variant', 'Cambió un logo'],
  ['POST', '/admin/marathons/:id/rehearsal', 'Creó un ensayo'],
  ['POST', '/admin/marathons/:id/reset-live', 'Reinició el en vivo'],
  ['POST', '/admin/marathons/:id/prepare', 'Preparó la largada'],
  ['POST', '/admin/marathons/:id/cancel-preparation', 'Canceló la preparación'],
  ['POST', '/admin/marathons/:id/start', 'Dio la largada'],
  ['POST', '/admin/marathons/:id/finish', 'Cerró la carrera'],
  ['POST', '/admin/marathons/:id/close-registrations', 'Cerró inscripciones'],
  ['POST', '/admin/marathons/:id/reopen-registrations', 'Reabrió inscripciones'],
  ['POST', '/admin/marathons/:id/results', 'Cargó resultados'],
  ['POST', '/admin/marathons/:id/recalculate-ranks', 'Recalculó puestos'],
  ['POST', '/admin/users', 'Creó una cuenta'],
  ['PUT', '/admin/users/:id', 'Editó una cuenta'],
  ['POST', '/admin/users/:id/password', 'Cambió una contraseña'],
  ['DELETE', '/admin/users/:id', 'Eliminó una cuenta'],
  ['POST', '/admin/roles', 'Creó un rol'],
  ['PUT', '/admin/roles/:key', 'Editó un rol'],
  ['DELETE', '/admin/roles/:key', 'Borró un rol'],
  ['POST', '/admin/payments/:id/confirm-transfer', 'Confirmó un cobro'],
  ['POST', '/admin/payments/:id/refund', 'Reembolsó un cobro'],
  ['POST', '/admin/payment-proofs/:id/approve', 'Aprobó un comprobante'],
  ['POST', '/admin/payment-proofs/:id/reject', 'Rechazó un comprobante'],
  ['PUT', '/admin/service-fee', 'Cambió el cargo por servicio'],
  ['POST', '/config/app/apk', 'Publicó un APK'],
]
const accion = (m, r) => ACCIONES.find(([mm, rr]) => mm === m && rr === r)?.[2] || `${m} ${r}`

const RESULTADOS = [['', 'Todo'], ['ok', 'Correctos'], ['denegado', 'Denegados'], ['error', 'Con error']]
const resultado = s => s === 403 ? ['Denegado', 'is-danger'] : s >= 400 ? [`Error ${s}`, 'is-warn'] : ['Correcto', 'is-ok']
const cuando = iso => new Date(iso).toLocaleString('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })
const iniciales = n => (n || '?').split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
const POR_PAGINA = 30

export default function PanelAuditoria({ sesion }) {
  const token = sesion.accessToken
  const [filas, setFilas] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [res, setRes] = useState('')
  const [q, setQ] = useState('')
  const [abierta, setAbierta] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  async function cargar(p = page) {
    setCargando(true); setError('')
    try {
      const r = await getAudit(token, { q: q.trim(), resultado: res, page: p, pageSize: POR_PAGINA })
      setFilas(r.data || []); setTotal(r.meta?.total || 0)
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar(page) }, [page, res])

  function buscar(e) { e.preventDefault(); if (page === 1) cargar(1); else setPage(1) }
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  return (
    <div className="ad-mod">
      <header className="ad-head">
        <div>
          <p className="ad-eyebrow">Auditoría</p>
          <h1>Registro de cambios</h1>
          <p className="ad-head-meta">Cada cambio hecho desde el panel y cada acceso denegado. Nadie puede editarlo ni borrarlo.</p>
        </div>
        <button className="ad-btn" onClick={() => cargar(page)}><Icon name="refresh" />Actualizar</button>
      </header>

      <div className="ad-chipbar" role="tablist" aria-label="Resultado">
        {RESULTADOS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={res === k} className={`ad-chip${res === k ? ' is-on' : ''}`} onClick={() => { setRes(k); setPage(1) }}>{l}</button>
        ))}
      </div>

      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}

      <section className="ad-card ad-table-card">
        <header className="ad-card-head">
          <div><h2>Eventos <span className="ad-count">{total.toLocaleString('es-BO')}</span></h2><p>Del más reciente al más antiguo.</p></div>
          <form className="ad-search" onSubmit={buscar} role="search">
            <Icon name="search" size={16} />
            <input type="search" placeholder="Persona, email, rol o ruta" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar en el registro" />
            <button className="ad-btn is-sm is-primary">Buscar</button>
          </form>
        </header>
        {cargando ? <div className="ad-skel ad-skel-table" /> : filas.length === 0 ? (
          <div className="ad-chart-empty"><Icon name="shield" size={22} /><p>Sin eventos con estos filtros.</p></div>
        ) : (
          <>
            <div className="ad-table-wrap">
              <table className="ad-table ad-table-cards">
                <thead><tr><th>Cuándo</th><th>Quién</th><th>Acción</th><th>Resultado</th><th><span className="sr-only">Detalle</span></th></tr></thead>
                <tbody>
                  {filas.map(f => {
                    const [rt, rc] = resultado(f.status)
                    const ver = abierta === f.id
                    return (
                      <Fragment key={f.id}>
                        <tr>
                          <td data-l="Cuándo" className="ad-num">{cuando(f.at)}</td>
                          <td><div className="ad-person"><span className="ad-avatar" aria-hidden="true">{iniciales(f.actor?.name)}</span><div><div className="cell-name">{f.actor?.name || 'Cuenta eliminada'}</div><div className="cell-sub">{f.actorRole && <span className={`ad-role is-${tono(f.actorRole)}`}>{f.actorRole}</span>} {f.actor?.email}</div></div></div></td>
                          <td data-l="Acción"><div className="cell-name">{accion(f.method, f.route)}</div>{f.targetId && <div className="cell-sub ad-mono">{f.targetId}</div>}</td>
                          <td data-l="Resultado"><span className={`ad-pill ${rc}`}>{rt}</span></td>
                          <td className="ad-row-actions">
                            <button className="ad-icon-btn" aria-expanded={ver} onClick={() => setAbierta(ver ? null : f.id)} aria-label="Ver detalle" title="Ver detalle"><Icon name="eye" size={16} /></button>
                          </td>
                        </tr>
                        {ver && (
                          <tr className="ad-audit-detail">
                            <td colSpan={5}>
                              <dl className="ad-dl">
                                <div><dt>Ruta</dt><dd className="ad-mono">{f.method} {f.route}</dd></div>
                                <div><dt>IP</dt><dd className="ad-mono">{f.ip || '—'}</dd></div>
                              </dl>
                              {f.detail && Object.keys(f.detail).length > 0 && <pre className="ad-pre">{JSON.stringify(f.detail, null, 2)}</pre>}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <footer className="ad-pager">
              <span>Página <b>{page}</b> de {paginas}</span>
              <div>
                <button className="ad-icon-btn" disabled={page <= 1} onClick={() => setPage(x => x - 1)} aria-label="Página anterior"><Icon name="chevron" style={{ transform: 'rotate(90deg)' }} /></button>
                <button className="ad-icon-btn" disabled={page >= paginas} onClick={() => setPage(x => x + 1)} aria-label="Página siguiente"><Icon name="chevron" style={{ transform: 'rotate(-90deg)' }} /></button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  )
}
