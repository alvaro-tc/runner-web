import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../components/AdminCharts'
import { downloadReceiptPdf, getRegistrationPayments, listaDe } from '../api'
import { bs, fecha, hora } from './util'

// Recibo visual de una inscripcion confirmada + el PDF oficial del backend
export default function Recibo({ inscripcion, carrera, token, onClose }) {
  const [pago, setPago] = useState(null)
  const [bajando, setBajando] = useState(false)
  const [error, setError] = useState('')
  const pd = inscripcion.personalData || {}

  useEffect(() => {
    getRegistrationPayments(inscripcion.id, token)
      .then(r => setPago(listaDe(r).find(p => p.status === 'paid') || null))
      .catch(() => {})
  }, [inscripcion.id, token])

  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  async function pdf() {
    setBajando(true); setError('')
    try { await downloadReceiptPdf(inscripcion.id, token) } catch (e) { setError(e.message) }
    setBajando(false)
  }

  const ref = pago?.methodDetails?.manualQr?.reference
  const total = pago?.amountCents ?? inscripcion.totalCents

  return createPortal(
    <div className="rn-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="rn-receipt" role="dialog" aria-modal="true" aria-labelledby="rn-receipt-title">
        <button className="rn-close" onClick={onClose} aria-label="Cerrar recibo"><Icon name="x" /></button>
        <header className="rn-receipt-top" style={carrera?.coverUrl ? { '--cover': `url("${carrera.coverUrl}")` } : undefined}>
          {carrera?.logoHorizontalUrl
            ? <img className="rn-receipt-logo" src={carrera.logoHorizontalUrl} alt="" />
            : <span className="rn-receipt-kicker">CAM RUN</span>}
          <h2 id="rn-receipt-title">{inscripcion.marathon?.name}</h2>
          <p>{fecha(inscripcion.marathon?.startsAt, { weekday: 'long', day: 'numeric', month: 'long' })} · {hora(inscripcion.marathon?.startsAt)} · {inscripcion.marathon?.city}</p>
          <span className="rn-stamp"><Icon name="check" size={14} />Pagado</span>
        </header>

        <div className="rn-receipt-bib">
          <span>Dorsal</span>
          <strong>{inscripcion.bibNumber || '—'}</strong>
        </div>

        <div className="rn-perforation" aria-hidden="true" />

        <dl className="rn-receipt-grid">
          <div><dt>Corredor</dt><dd>{pd.fullName || '—'}</dd></div>
          <div><dt>Documento</dt><dd>{pd.docId || '—'}</dd></div>
          <div><dt>Talla</dt><dd>{pd.shirtSize || '—'}</dd></div>
          <div><dt>Inscrito el</dt><dd>{fecha(inscripcion.registeredAt)}</dd></div>
          {ref && <div><dt>Referencia</dt><dd className="rn-mono">{ref}</dd></div>}
          {pago?.paidAt && <div><dt>Pagado el</dt><dd>{fecha(pago.paidAt)} {hora(pago.paidAt)}</dd></div>}
        </dl>

        <ul className="rn-lines">
          {(inscripcion.items || []).map((l, i) => (
            <li key={i}><span>{l.label}{l.quantity > 1 && ` × ${l.quantity}`}</span><span>{bs(l.amountCents, inscripcion.currency)}</span></li>
          ))}
          {inscripcion.serviceFee && <li><span>{inscripcion.serviceFee.label}</span><span>{bs(inscripcion.serviceFee.amountCents, inscripcion.currency)}</span></li>}
          <li className="is-total"><span>Total pagado</span><span>{bs(total, inscripcion.currency)}</span></li>
        </ul>

        {error && <p className="rn-error" role="alert">{error}</p>}
        <div className="rn-receipt-actions">
          <button className="rn-btn" onClick={pdf} disabled={bajando}>
            {bajando ? <span className="rn-spin" /> : <Icon name="download" size={18} />}Descargar PDF
          </button>
        </div>
        <p className="rn-receipt-foot">Comprobante de donación por inscripción · No es una factura</p>
      </div>
    </div>,
    document.body,
  )
}
