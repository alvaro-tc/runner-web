import { useEffect, useState } from 'react'
import { Icon } from './components/AdminCharts'
import DonationReceipt from './components/DonationReceipt'
import { getAdminPayments, getAdminMarathons, confirmTransfer, approvePaymentProof, rejectPaymentProof, downloadPaymentsCsv } from './api'

const ESTADOS = [['pending', 'Por validar'], ['paid', 'Pagados'], ['failed', 'Fallidos'], ['refunded', 'Reembolsados'], ['', 'Todos']]
const ESTADO = { pending: ['Pendiente', 'is-warn'], paid: ['Pagado', 'is-ok'], failed: ['Fallido', 'is-danger'], refunded: ['Reembolsado', ''] }
const METODO = { qr_manual: 'QR', bank_transfer: 'Transferencia', qr: 'QR', card: 'Tarjeta' }
const POR_PAGINA = 20
const bs = c => `Bs ${((c || 0) / 100).toLocaleString('es-BO', { maximumFractionDigits: 2 })}`
const iniciales = n => (n || '?').split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()

export default function PanelCobros({ sesion, puede }) {
  const token = sesion.accessToken
  const valida = puede('cobros.validar')
  const [pagos, setPagos] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState('pending')
  const [carrera, setCarrera] = useState('')
  const [carreras, setCarreras] = useState([])
  const [q, setQ] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [sel, setSel] = useState(null)
  const [recibo, setRecibo] = useState(null)

  async function cargar(p = page) {
    setCargando(true); setError('')
    try {
      const r = await getAdminPayments(token, { q: q.trim(), status: estado, marathonId: carrera, page: p, pageSize: POR_PAGINA })
      setPagos(r.data || []); setTotal(r.meta?.total || 0)
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  useEffect(() => { if (puede('carreras.ver')) getAdminMarathons(token).then(setCarreras, () => {}) }, [])
  useEffect(() => { cargar(page) }, [page, estado, carrera])

  function buscar(e) { e.preventDefault(); if (page === 1) cargar(1); else setPage(1) }
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  return (
    <div className="ad-mod">
      <header className="ad-head">
        <div>
          <p className="ad-eyebrow">Cobros</p>
          <h1>Pagos y comprobantes</h1>
          <p className="ad-head-meta">{valida ? 'Revisá el comprobante y aprobá o rechazá el pago.' : 'Solo lectura: tu rol no valida cobros.'}</p>
        </div>
        <button className="ad-btn" onClick={() => downloadPaymentsCsv(token, { q, status: estado, marathonId: carrera }).catch(e => setError(e.message))}><Icon name="download" />Exportar a Excel</button>
      </header>

      <div className="ad-chipbar" role="tablist" aria-label="Estado del cobro">
        {ESTADOS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={estado === k} className={`ad-chip${estado === k ? ' is-on' : ''}`} onClick={() => { setEstado(k); setPage(1) }}>{l}</button>
        ))}
        {carreras.length > 0 && (
          <select className="ad-select" value={carrera} onChange={e => { setCarrera(e.target.value); setPage(1) }} aria-label="Carrera">
            <option value="">Todas las carreras</option>
            {carreras.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
      </div>

      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}

      <section className="ad-card ad-table-card">
        <header className="ad-card-head">
          <div><h2>Cobros <span className="ad-count">{total.toLocaleString('es-BO')}</span></h2><p>Del más nuevo al más antiguo.</p></div>
          <form className="ad-search" onSubmit={buscar} role="search">
            <Icon name="search" size={16} />
            <input type="search" placeholder="Nombre, CI, celular, dorsal o transacción" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar cobro" />
            <button className="ad-btn is-sm is-primary">Buscar</button>
          </form>
        </header>
        {cargando ? <div className="ad-skel ad-skel-table" /> : pagos.length === 0 ? (
          <div className="ad-chart-empty"><Icon name="receipt" size={22} /><p>No hay cobros con estos filtros.</p></div>
        ) : (
          <>
            <div className="ad-table-wrap">
              <table className="ad-table ad-table-cards">
                <thead><tr><th>Corredora</th><th>Carrera</th><th>Monto</th><th>Método</th><th>Estado</th><th>Validado por</th><th><span className="sr-only">Acción</span></th></tr></thead>
                <tbody>
                  {pagos.map(p => {
                    const [et, ec] = ESTADO[p.status] || [p.status, '']
                    return (
                      <tr key={p.id}>
                        <td><div className="ad-person"><span className="ad-avatar" aria-hidden="true">{iniciales(p.runner)}</span><div><div className="cell-name">{p.runner}</div><div className="cell-sub">{p.runnerCi || p.runnerEmail || '—'}</div></div></div></td>
                        <td data-l="Carrera">{p.marathon}</td>
                        <td data-l="Monto" className="ad-num">{bs(p.amountCents)}</td>
                        <td data-l="Método">{METODO[p.method] || p.method}</td>
                        <td data-l="Estado"><span className={`ad-pill ${ec}`}>{et}</span>
                          {p.status === 'pending' && <div className="cell-sub">{p.proofId ? 'Comprobante por revisar' : p.proofStatus === 'rejected' ? 'Comprobante rechazado' : 'Sin comprobante'}</div>}</td>
                        <td data-l="Validado por">{p.validatedBy || '—'}</td>
                        <td className="ad-row-actions">
                          <button className={`ad-btn is-sm${p.status === 'pending' && valida ? ' is-primary' : ''}`} onClick={() => setSel(p)}>{p.status === 'pending' && valida ? 'Validar' : 'Ver'}</button>
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
                <button className="ad-icon-btn" disabled={page <= 1} onClick={() => setPage(x => x - 1)} aria-label="Página anterior"><Icon name="chevron" style={{ transform: 'rotate(90deg)' }} /></button>
                <button className="ad-icon-btn" disabled={page >= paginas} onClick={() => setPage(x => x + 1)} aria-label="Página siguiente"><Icon name="chevron" style={{ transform: 'rotate(-90deg)' }} /></button>
              </div>
            </footer>
          </>
        )}
      </section>

      {sel && <ModalCobro token={token} pago={sel} valida={valida} onCerrar={() => setSel(null)} onListo={(r) => { setSel(null); cargar(page); if (r) setRecibo(r) }} />}
      {recibo && <DonationReceipt data={recibo} onClose={() => setRecibo(null)} />}
    </div>
  )
}

function ModalCobro({ token, pago, valida, onCerrar, onListo }) {
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const pendiente = pago.status === 'pending' && valida

  async function aprobar() {
    setGuardando(true); setError('')
    try {
      if (pago.proofId) await approvePaymentProof(pago.proofId, nota, token)
      else await confirmTransfer(pago.id, token)
      onListo({ receiptNumber: String(pago.id).slice(-8).toUpperCase(), paymentId: pago.id, donor: pago.runner, concept: pago.marathon, amountCents: pago.amountCents, currency: 'Bolivianos', currencySymbol: 'Bs', date: new Date() })
    } catch (e) { setError(e.message); setGuardando(false) }
  }

  async function rechazar() {
    if (!nota.trim()) { setError('Escribí el motivo del rechazo: la corredora lo verá.'); return }
    setGuardando(true); setError('')
    try { await rejectPaymentProof(pago.proofId, nota, token); onListo() }
    catch (e) { setError(e.message); setGuardando(false) }
  }

  const datos = [
    ['Monto', bs(pago.amountCents)], ['Carrera', pago.marathon], ['CI', pago.runnerCi], ['Celular', pago.runnerPhone],
    ['Email', pago.runnerEmail], ['Método', METODO[pago.method] || pago.method], ['Referencia', pago.proofReference || 'No indicada'],
    ['Fecha', new Date(pago.createdAt).toLocaleString('es-BO')], ['Validado por', pago.validatedBy], ['Nota', pago.proofNote],
  ].filter(([, v]) => v)

  return (
    <div className="modal-overlay" onClick={() => !guardando && onCerrar()}>
      <div className="modal ad-modal is-wide" role="dialog" aria-modal="true" aria-label={`Cobro de ${pago.runner}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>Cobro de {pago.runner}</h2><button className="modal-close" onClick={onCerrar} aria-label="Cerrar">×</button></div>
        <div className="modal-body ad-cobro">
          <div className="ad-cobro-proof">
            {pago.proofImageUrl
              ? <a href={pago.proofImageUrl} target="_blank" rel="noreferrer" title="Abrir en tamaño completo"><img src={pago.proofImageUrl} alt={`Comprobante de ${pago.runner}`} /></a>
              : <div className="ad-chart-empty"><Icon name="image" size={22} /><p>No se subió comprobante.</p></div>}
          </div>
          <div>
            <dl className="ad-dl">{datos.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            {pendiente && pago.proofId && (
              <label className="ad-field"><span>Nota (obligatoria para rechazar)</span>
                <textarea rows="2" value={nota} onChange={e => setNota(e.target.value)} placeholder="Ej.: el monto no coincide con el extracto" />
              </label>
            )}
            {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="ad-btn is-ghost" onClick={onCerrar} disabled={guardando}>Cerrar</button>
          {pendiente && pago.proofId && <button className="ad-btn is-danger" onClick={rechazar} disabled={guardando}>Rechazar</button>}
          {pendiente && <button className="ad-btn is-primary" onClick={aprobar} disabled={guardando}>{guardando ? 'Guardando…' : pago.proofId ? 'Aprobar pago' : 'Confirmar sin comprobante'}</button>}
        </div>
      </div>
    </div>
  )
}
