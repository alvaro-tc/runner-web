import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SelectorCarrera } from './PanelCarreras'
import { Icon } from './components/AdminCharts'
import DonationReceipt from './components/DonationReceipt'
import InscripcionFisica from './InscripcionFisica'
import { getAdminPayments, getAdminMarathons, getPaymentsSummary, confirmTransfer, approvePaymentProof, rejectPaymentProof, refundPayment, downloadPaymentsCsv } from './api'

const ESTADOS = [['pending', 'Por validar'], ['paid', 'Pagados'], ['failed', 'Fallidos'], ['refunded', 'Anulados'], ['', 'Todos']]
const ESTADO = { pending: ['Pendiente', 'is-warn'], paid: ['Pagado', 'is-ok'], failed: ['Fallido', 'is-danger'], refunded: ['Anulado', ''] }
export const CANAL = { qr: 'QR', api: 'API banco', fisico: 'Físico' }
const METODO = { qr_manual: 'QR', bank_transfer: 'Transferencia', qr: 'QR', card: 'Tarjeta', cash: 'Efectivo' }
const POR_PAGINA = 20
const bs = c => `Bs ${((c || 0) / 100).toLocaleString('es-BO', { maximumFractionDigits: 2 })}`
const iniciales = n => (n || '?').split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
const fechaHora = iso => iso ? new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : null

export const Canal = ({ c }) => c ? <span className={`ad-channel is-${c}`}>{CANAL[c]}</span> : null

export default function PanelCobros({ sesion, puede, carrera: carreraPref, onCarrera }) {
  const token = sesion.accessToken
  const valida = puede('cobros.validar')
  const anula = puede('inscritas.anular')
  const [pagos, setPagos] = useState([])
  const [total, setTotal] = useState(0)
  const [resumen, setResumen] = useState(null)
  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState('pending')
  const [carrera, setCarrera] = useState(carreraPref || '')
  const [canal, setCanal] = useState('')
  const [cobrador, setCobrador] = useState('')
  const [carreras, setCarreras] = useState([])
  const [q, setQ] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [sel, setSel] = useState(null)
  const [recibo, setRecibo] = useState(null)
  const [fisica, setFisica] = useState(false)
  // La validacion de cada carrera puede estar asignada a la API o a otro organizador:
  // entonces solo se mira. El backend lo vuelve a comprobar.
  const meToca = p => valida && !p.byApi && (!p.validatorId || p.validatorId === sesion.user.id)
  const filtros = () => ({ q: q.trim(), status: estado, marathonId: carrera, channel: canal, validatedById: cobrador })

  async function cargar(p = page) {
    setCargando(true); setError('')
    const f = filtros()
    getPaymentsSummary(token, f).then(setResumen, () => setResumen(null))
    try {
      const r = await getAdminPayments(token, { ...f, page: p, pageSize: POR_PAGINA })
      setPagos(r.data || []); setTotal(r.meta?.total || 0)
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  useEffect(() => { if (puede('carreras.ver')) getAdminMarathons(token).then(setCarreras, () => {}) }, [])
  useEffect(() => { cargar(page) }, [page, estado, carrera, canal, cobrador])

  function buscar(e) { e.preventDefault(); if (page === 1) cargar(1); else setPage(1) }
  function elegirCarrera(id) { setCarrera(id); setPage(1); if (id) onCarrera?.(id) }
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const selCarrera = carreras.find(m => m.id === carrera)

  return (
    <div className="ad-mod">
      <header className="ad-head">
        <div>
          <p className="ad-eyebrow">Cobros</p>
          <h1>Pagos y comprobantes</h1>
          <p className="ad-head-meta">{valida ? 'Revisá el comprobante y aprobá o rechazá el pago.' : 'Solo lectura: tu rol no valida cobros.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {puede('inscritas.manual') && selCarrera && <button className="ad-btn is-primary" onClick={() => setFisica(true)}><Icon name="plus" />Inscribir en físico</button>}
          <button className="ad-btn" onClick={() => downloadPaymentsCsv(token, filtros()).catch(e => setError(e.message))}><Icon name="download" />Exportar{canal ? ` (${CANAL[canal]})` : ''}</button>
        </div>
      </header>

      {carreras.length > 0 && (
        <div className="ad-toolbar">
          <SelectorCarrera carreras={carreras} sel={selCarrera} todas="Todas las carreras" onElegir={elegirCarrera} />
        </div>
      )}

      <div className="ad-chipbar" role="tablist" aria-label="Estado del cobro">
        {ESTADOS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={estado === k} className={`ad-chip${estado === k ? ' is-on' : ''}`} onClick={() => { setEstado(k); setPage(1) }}>{l}</button>
        ))}
      </div>

      <div className="ad-filters">
        <label className="sr-only" htmlFor="f-canal">Medio de pago</label>
        <select id="f-canal" value={canal} onChange={e => { setCanal(e.target.value); setPage(1) }}>
          <option value="">Todos los medios</option>
          {Object.entries(CANAL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-cobrador">Cobrado por</label>
        <select id="f-cobrador" value={cobrador} onChange={e => { setCobrador(e.target.value); setPage(1) }}>
          <option value="">Cobrado por: todos</option>
          {(resumen?.byValidator || []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        {(canal || cobrador) && <button className="ad-btn is-sm is-ghost" onClick={() => { setCanal(''); setCobrador(''); setPage(1) }}>Limpiar filtros</button>}
      </div>

      {resumen && (
        <div className="ad-totals" aria-live="polite">
          <div className="ad-total is-main">
            <small>Total cobrado{canal ? ` · ${CANAL[canal]}` : ''}</small>
            <strong>{bs(resumen.paidCents)}</strong>
            <span>{resumen.paidCount.toLocaleString('es-BO')} pagos acreditados</span>
          </div>
          {resumen.byValidator.filter(v => !cobrador || v.id === cobrador).slice(0, 3).map(v => (
            <div key={v.id} className="ad-total">
              <small>{v.name}</small>
              <strong>{bs(v.paidCents)}</strong>
              <span>{v.paidCount.toLocaleString('es-BO')} pagos</span>
            </div>
          ))}
        </div>
      )}

      {aviso && <p className="ad-ok-note" role="status" style={{ marginBottom: '1rem' }}><Icon name="check" />{aviso}</p>}
      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}

      <section className="ad-card ad-table-card">
        <header className="ad-card-head">
          <div><h2>Cobros <span className="ad-count">{total.toLocaleString('es-BO')}</span></h2><p>Los pendientes primero.</p></div>
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
                <thead><tr><th>Corredora</th><th>Carrera</th><th>Monto</th><th>Medio</th><th>Estado</th><th>Validado por</th><th><span className="sr-only">Acción</span></th></tr></thead>
                <tbody>
                  {pagos.map(p => {
                    const [et, ec] = ESTADO[p.status] || [p.status, '']
                    const toca = p.status === 'pending' && meToca(p)
                    return (
                      <tr key={p.id}>
                        <td><div className="ad-person"><span className="ad-avatar" aria-hidden="true">{iniciales(p.runner)}</span><div><div className="cell-name">{p.runner}</div><div className="cell-sub">{p.runnerCi || p.runnerEmail || '—'}</div></div></div></td>
                        <td data-l="Carrera">{p.marathon}</td>
                        <td data-l="Monto" className="ad-num">{bs(p.amountCents)}</td>
                        <td data-l="Medio"><Canal c={p.channel} />{!p.channel && (METODO[p.method] || p.method)}</td>
                        <td data-l="Estado"><span className={`ad-pill ${ec}`}>{et}</span>
                          {p.status === 'pending' && <div className="cell-sub">{p.byApi ? 'Esperando a la API' : p.proofId ? 'Comprobante por revisar' : p.proofStatus === 'rejected' ? 'Comprobante rechazado' : 'Sin comprobante'}</div>}</td>
                        <td data-l="Validado por">{p.validatedBy || '—'}{p.status === 'pending' && p.validator && <div className="cell-sub">Asignado a {p.validator}</div>}</td>
                        <td className="ad-row-actions">
                          <button className={`ad-btn is-sm${toca ? ' is-primary' : ''}`} onClick={() => setSel(p)}>{toca ? 'Validar' : 'Ver'}</button>
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

      {sel && <ModalCobro token={token} pago={sel} valida={meToca(sel)} anula={anula}
        onCerrar={() => setSel(null)}
        onListo={(msg, r) => { setSel(null); setAviso(msg); cargar(page); if (r) setRecibo(r) }} />}
      {recibo && <DonationReceipt data={recibo} onClose={() => setRecibo(null)} />}
      {fisica && <InscripcionFisica token={token} carrera={selCarrera} onCerrar={() => setFisica(false)}
        onListo={msg => { setFisica(false); setAviso(msg); cargar(page) }} />}
    </div>
  )
}

/** Ficha del cobro: comprobante a la izquierda, datos y decisión a la derecha. */
export function ModalCobro({ token, pago, valida, anula, onCerrar, onListo }) {
  const [decision, setDecision] = useState(pago.proofId ? '' : 'aprobar')
  const [nota, setNota] = useState('')
  const [motivo, setMotivo] = useState('')
  const [anulando, setAnulando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [img, setImg] = useState('cargando')
  const pendiente = pago.status === 'pending' && valida
  const soloVer = pago.status === 'pending' && !valida && pago.validator
  const puedeAnular = anula && pago.status === 'paid'

  useEffect(() => {
    const esc = e => e.key === 'Escape' && !guardando && onCerrar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [guardando])

  async function correr(fn) {
    setGuardando(true); setError('')
    try { await fn() } catch (e) { setError(e.message); setGuardando(false) }
  }

  const aprobar = () => correr(async () => {
    if (pago.proofId) await approvePaymentProof(pago.proofId, nota, token)
    else await confirmTransfer(pago.id, token)
    onListo(`Pago de ${pago.runner} aprobado: ya figura como inscrita.`, { receiptNumber: String(pago.id).slice(-8).toUpperCase(), paymentId: pago.id, donor: pago.runner, concept: pago.marathon, amountCents: pago.amountCents, currency: 'Bolivianos', currencySymbol: 'Bs', date: new Date() })
  })

  const rechazar = () => {
    if (!nota.trim()) { setError('Escribí el motivo del rechazo: la corredora lo verá.'); return }
    correr(async () => { await rejectPaymentProof(pago.proofId, nota, token); onListo(`Comprobante de ${pago.runner} rechazado.`) })
  }

  const anular = () => {
    if (!motivo.trim()) { setError('Escribí por qué se anula la inscripción.'); return }
    correr(async () => { await refundPayment(token, pago.id, motivo.trim()); onListo(`Inscripción de ${pago.runner} anulada: el cupo quedó libre.`) })
  }

  const datos = [
    ['Monto', bs(pago.amountCents)], ['Carrera', pago.marathon], ['Dorsal', pago.bibNumber], ['CI', pago.runnerCi], ['Celular', pago.runnerPhone],
    ['Email', pago.runnerEmail], ['Medio', pago.channel ? CANAL[pago.channel] : (METODO[pago.method] || pago.method)], ['Referencia', pago.proofReference || 'No indicada'],
    ['Creado', fechaHora(pago.createdAt)], ['Pagado', fechaHora(pago.paidAt)], ['Validado por', pago.validatedBy], ['Asignado a', pago.validator],
    ['Nota', pago.proofNote], ['Anulado por', pago.refundedBy], ['Motivo', pago.refundReason],
  ].filter(([, v]) => v)

  // Portal a <body>: ningun ancestro animado puede atrapar el overlay fijo.
  return createPortal(
    <div className="modal-overlay" onClick={() => !guardando && onCerrar()}>
      <div className="modal ad-modal is-wide" role="dialog" aria-modal="true" aria-labelledby="cobro-t" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2 id="cobro-t">Cobro de {pago.runner}</h2><button className="modal-close" onClick={onCerrar} aria-label="Cerrar">×</button></div>
        <div className="modal-body ad-cobro">
          <div className="ad-cobro-proof">
            {!pago.proofImageUrl ? <div className="ad-chart-empty"><Icon name="image" size={22} /><p>{pago.channel === 'fisico' ? 'Pago en efectivo: no hay comprobante.' : 'No se subió comprobante.'}</p></div>
              : img === 'error' ? (
                <div className="ad-chart-empty" role="alert"><Icon name="alert" size={22} /><p>No se pudo cargar la imagen.</p>
                  <a className="ad-btn is-sm" href={pago.proofImageUrl} target="_blank" rel="noreferrer">Abrir en otra pestaña</a></div>
              ) : (
                <a href={pago.proofImageUrl} target="_blank" rel="noreferrer" title="Abrir en tamaño completo" className={img === 'cargando' ? 'is-loading' : ''}>
                  {img === 'cargando' && <span className="ad-skel" aria-hidden="true" />}
                  <img src={pago.proofImageUrl} alt={`Comprobante de ${pago.runner}`} onLoad={() => setImg('ok')} onError={() => setImg('error')} />
                </a>
              )}
          </div>
          <div style={{ display: 'grid', gap: '.85rem', alignContent: 'start' }}>
            <dl className="ad-dl" style={{ margin: 0 }}>{datos.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>

            {pendiente && pago.proofId && (
              <div className="ad-decide" role="group" aria-label="Decisión sobre el comprobante">
                <button type="button" className="is-approve" aria-pressed={decision === 'aprobar'} onClick={() => { setDecision('aprobar'); setError('') }}>
                  <strong><Icon name="check" size={16} />Aprobar</strong><small>El monto cuadra con el extracto</small>
                </button>
                <button type="button" className="is-reject" aria-pressed={decision === 'rechazar'} onClick={() => { setDecision('rechazar'); setError('') }}>
                  <strong><Icon name="alert" size={16} />Rechazar</strong><small>La corredora podrá subir otro</small>
                </button>
              </div>
            )}
            {pendiente && pago.proofId && decision && (
              <label className="ad-field"><span>{decision === 'rechazar' ? 'Motivo del rechazo (obligatorio)' : 'Nota (opcional)'}</span>
                <textarea rows="2" value={nota} onChange={e => setNota(e.target.value)} autoFocus={decision === 'rechazar'}
                  placeholder={decision === 'rechazar' ? 'Ej.: el monto no coincide con el extracto' : 'Ej.: verificado en el extracto del BNB'} />
                {decision === 'rechazar' && <small>La corredora verá este mensaje.</small>}
              </label>
            )}
            {pendiente && !pago.proofId && <p className="ad-info-note" role="note"><Icon name="info" />No hay comprobante: confirmá solo si verificaste el pago en el extracto.</p>}

            {puedeAnular && (anulando ? (
              <label className="ad-field"><span>Motivo de la anulación (obligatorio)</span>
                <textarea rows="2" value={motivo} onChange={e => setMotivo(e.target.value)} autoFocus placeholder="Ej.: lesión, pidió la devolución" />
                <small>Deja de figurar como inscrita y su cupo y dorsal se liberan. El dinero se devuelve por fuera, por el mismo canal.</small>
              </label>
            ) : null)}

            {soloVer && <p className="ad-info-note" role="note"><Icon name="info" />{pago.byApi ? 'Este cobro lo valida la API de pagos automáticamente.' : `La validación de esta carrera está asignada a ${pago.validator}.`}</p>}
            {error && <p className="ad-alert" role="alert" style={{ margin: 0 }}><Icon name="alert" />{error}</p>}
          </div>
        </div>
        <div className="modal-footer">
          {puedeAnular && !anulando && <button className="ad-btn is-danger" onClick={() => setAnulando(true)} disabled={guardando}><Icon name="trash" size={16} />Anular inscripción</button>}
          <span className="ad-spacer" />
          <button className="ad-btn is-ghost" onClick={anulando ? () => { setAnulando(false); setError('') } : onCerrar} disabled={guardando}>{anulando ? 'Volver' : 'Cerrar'}</button>
          {anulando && <button className="ad-btn is-solid-danger" onClick={anular} disabled={guardando}>{guardando ? 'Anulando…' : 'Confirmar anulación'}</button>}
          {pendiente && decision === 'rechazar' && <button className="ad-btn is-solid-danger" onClick={rechazar} disabled={guardando}>{guardando ? 'Guardando…' : 'Rechazar comprobante'}</button>}
          {pendiente && decision === 'aprobar' && <button className="ad-btn is-ok" onClick={aprobar} disabled={guardando}><Icon name="check" size={16} />{guardando ? 'Guardando…' : pago.proofId ? 'Aprobar pago' : 'Confirmar pago'}</button>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
