function formatDate(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function numberToWords(n) {
  const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
    
  function underHundred(value) {
    if (value < 10) return unidades[value]
    if (value < 20) return especiales[value - 10]
    if (value < 30) return value === 20 ? 'veinte' : `veinti${unidades[value - 20]}`
    const d = Math.floor(value / 10)
    const u = value % 10
    return u ? `${decenas[d]} y ${unidades[u]}` : decenas[d]
  }

  function underThousand(value) {
    if (value < 100) return underHundred(value)
    if (value === 100) return 'cien'
    const c = Math.floor(value / 100)
    const r = value % 100
    const cientos = ['', '', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']
    const prefix = c === 1 ? 'ciento' : cientos[c]
    return r ? `${prefix} ${underHundred(r)}` : prefix
  }

  if (n === 0) return 'cero'
  if (n < 1000) return underThousand(n)
  if (n < 1000000) {
    const miles = Math.floor(n / 1000)
    const resto = n % 1000
    const milesTexto = miles === 1 ? 'mil' : `${underThousand(miles)} mil`
    return resto ? `${milesTexto} ${underThousand(resto)}` : milesTexto
  }
  return n.toLocaleString('es-BO')
}

function amountInWords(amount) {
  const value = Number(amount) || 0
  const entero = Math.floor(value)
  const centavos = Math.round((value - entero) * 100)
  return `${numberToWords(entero)} ${centavos.toString().padStart(2, '0')}/100`
}

export default function DonationReceipt({ data, onClose }) {
  const amount = Number(data?.amountCents ?? data?.amount ?? 0) / (data?.amountCents != null ? 100 : 1)
  const money = `${amount.toFixed(2)} ${data?.currencySymbol || 'Bs'}`

  return (
    <div className="receipt-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={e => e.stopPropagation()}>
        <div className="receipt-modal-header">
          <div>
            <h2>Recibo de donación</h2>
            <p>Para PDF en alta calidad elige «Guardar como PDF» al imprimir.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="receipt-preview">
          <article className="receipt-sheet">
            <img className="rc-illus" src="/recibo-ilustracion.png" alt="" />
            <header className="rc-head">
              <h1>DONACIONES</h1>
              <strong>Centro de Ayuda para la Mujer</strong>
              <span>Av. Arce Nro. 2396</span>
              <span>La Paz - Bolivia</span>
            </header>
            <div className="rc-nro">Nro. <b>{data?.receiptNumber || data?.paymentId || '—'}</b></div>
            <img className="rc-logo" src="/recibo-logo.png" alt="CAM - Centro de ayuda para la Mujer" />

            <div className="rc-table">
              <span>Donador</span><span>Concepto</span><span>Bs. / $US</span><span>Total</span>
              <b>{data?.donor || data?.runner || '—'}</b>
              <b>{data?.concept || data?.marathon || '—'}</b>
              <b>{money}</b>
              <b>{money}</b>
            </div>
            <div className="rc-line">La suma de: <b>{amountInWords(amount)}</b><span>Bolivianos/Dólares</span></div>
            <div className="rc-line">Fecha: <b>{formatDate(data?.date)}</b></div>
            <p className="rc-quote">Ayúdenos también ustedes, y ayúdense unos a otros a construir puentes, con el diálogo, con el encuentro, uniéndonos todos para ser un solo pueblo siempre en paz -&nbsp; Papa Leon XIV</p>
          </article>
        </div>

        <div className="receipt-actions">
          <button className="btn-outline" onClick={onClose}>Cerrar</button>
          <button className="btn-primary" onClick={() => window.print()}>Imprimir / PDF</button>
        </div>
      </div>
    </div>
  )
}
