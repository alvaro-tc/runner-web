import { useEffect, useRef, useState } from 'react'

const WIDTH = 828
const HEIGHT = 477
const TEMPLATE = '/recibo-donaciones.png'

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

function drawFitText(ctx, text, x, y, maxWidth, align = 'left', maxFont = 15, minFont = 9) {
  let fontSize = maxFont
  ctx.textAlign = align
  while (fontSize > minFont) {
    ctx.font = `${fontSize}px Arial, sans-serif`
    if (ctx.measureText(text).width <= maxWidth) break
    fontSize -= 1
  }
  ctx.fillText(text, x, y)
}

function amountInWords(amount) {
  const value = Number(amount) || 0
  const entero = Math.floor(value)
  const centavos = Math.round((value - entero) * 100)
  return `${numberToWords(entero)} ${centavos.toString().padStart(2, '0')}/100`
}

export default function DonationReceiptCanvas({ data, onClose }) {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)

  const amount = Number(data?.amountCents ?? data?.amount ?? 0) / (data?.amountCents != null ? 100 : 1)
  const currency = data?.currency || 'Bolivianos'

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const image = new Image()
    image.src = TEMPLATE
    image.onload = () => {
      if (cancelled) return

      canvas.width = WIDTH
      canvas.height = HEIGHT
      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      ctx.drawImage(image, 0, 0, WIDTH, HEIGHT)

      ctx.fillStyle = '#222'
      ctx.font = '15px Arial, sans-serif'
      ctx.textBaseline = 'middle'

      // Número de recibo.
      drawFitText(ctx, String(data?.receiptNumber || data?.paymentId || '—'), 700, 37, 95, 'left', 14, 9)

      // Fila principal del recibo.
      drawFitText(ctx, String(data?.donor || data?.runner || '—'), 152, 273, 160, 'left', 14, 9)
      drawFitText(ctx, String(data?.concept || data?.marathon || '—'), 393, 273, 165, 'left', 14, 9)
      drawFitText(ctx, `${amount.toFixed(2)} ${data?.currencySymbol || 'Bs'}`, 630, 273, 105, 'center', 14, 9)
      drawFitText(ctx, `${amount.toFixed(2)} ${data?.currencySymbol || 'Bs'}`, 765, 273, 115, 'center', 14, 9)

      // Importe escrito. El texto "Bolivianos/Dólares" ya forma parte de la plantilla.
      drawFitText(ctx, amountInWords(amount), 135, 323, 500, 'left', 14, 8)

      // Fecha.
      drawFitText(ctx, formatDate(data?.date), 90, 387, 110, 'left', 14, 9)

      setReady(true)
    }

    image.onerror = () => setReady(false)
    return () => { cancelled = true }
  }, [data, amount, currency])

  function downloadReceipt() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `recibo-donacion-${data?.receiptNumber || data?.paymentId || 'nuevo'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function printReceipt() {
    const canvas = canvasRef.current
    if (!canvas) return
    const image = canvas.toDataURL('image/png')
    const printWindow = window.open('', '_blank', 'width=900,height=650')
    if (!printWindow) return
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head><title>Recibo de donación</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:flex-start;background:#fff;">
          <img src="${image}" style="width:100%;max-width:828px;height:auto;" onload="window.print();" />
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="receipt-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={e => e.stopPropagation()}>
        <div className="receipt-modal-header">
          <div>
            <h2>Recibo de donación</h2>
            <p>Los datos se colocan sobre la plantilla original mediante Canvas.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="receipt-preview">
          <canvas ref={canvasRef} aria-label="Vista previa del recibo de donación" />
          {!ready && <div className="receipt-loading">Cargando recibo…</div>}
        </div>

        <div className="receipt-actions">
          <button className="btn-outline" onClick={onClose}>Cerrar</button>
          <button className="btn-outline" onClick={printReceipt} disabled={!ready}>Imprimir</button>
          <button className="btn-primary" onClick={downloadReceipt} disabled={!ready}>Descargar PNG</button>
        </div>
      </div>
    </div>
  )
}
