import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../components/AdminCharts'
import { getReceiptPdf } from '../api'

// Igual que RaceReceiptPage de la app: el PDF del backend, y guardar o imprimir
export default function Recibo({ inscripcion, token, onClose }) {
  const [pdf, setPdf] = useState(null) // { blob, url }
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const marco = useRef(null)
  const nombre = `recibo-${inscripcion.id}.pdf`

  useEffect(() => {
    let url
    setError(''); setPdf(null)
    getReceiptPdf(inscripcion.id, token)
      .then(blob => { url = URL.createObjectURL(blob); setPdf({ blob, url }) })
      .catch(() => setError('No se pudo abrir el recibo. Vuelve a intentarlo.'))
    return () => url && URL.revokeObjectURL(url)
  }, [inscripcion.id, token, intento])

  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  async function guardar() {
    const archivo = new File([pdf.blob], nombre, { type: 'application/pdf' })
    if (navigator.canShare?.({ files: [archivo] })) {
      try { return await navigator.share({ files: [archivo], title: 'Recibo de donación' }) } catch (e) { if (e.name === 'AbortError') return }
    }
    const a = document.createElement('a')
    a.href = pdf.url
    a.download = nombre
    a.click()
  }

  function imprimir() {
    try { marco.current.contentWindow.print() } catch { window.open(pdf.url, '_blank') }
  }

  return createPortal(
    <div className="rn-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="rn-sheet is-receipt" role="dialog" aria-modal="true" aria-labelledby="rn-receipt-title">
        <header className="rn-sheet-bar">
          <h2 id="rn-receipt-title">Recibo de donación</h2>
          <button className="rn-icon-btn" onClick={onClose} aria-label="Cerrar recibo"><Icon name="x" /></button>
        </header>
        <div className="rn-receipt-doc">
          {error ? (
            <div className="rn-empty is-flat">
              <span className="rn-empty-icon"><Icon name="alert" size={28} /></span>
              <p>{error}</p>
              <button className="rn-btn is-outline" onClick={() => setIntento(i => i + 1)}><Icon name="refresh" size={18} />Reintentar</button>
            </div>
          ) : pdf ? (
            <iframe ref={marco} src={`${pdf.url}#toolbar=0&navpanes=0&view=FitH`} title={`Recibo de ${inscripcion.marathon?.name}`} />
          ) : (
            <div className="rn-skel is-receipt" />
          )}
        </div>
        <div className="rn-receipt-actions">
          <button className="rn-btn is-block" onClick={guardar} disabled={!pdf}><Icon name="download" size={20} />Guardar o compartir</button>
          <button className="rn-btn is-outline is-block" onClick={imprimir} disabled={!pdf}><Icon name="receipt" size={20} />Imprimir</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
