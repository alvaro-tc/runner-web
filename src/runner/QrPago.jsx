import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Icon } from '../components/AdminCharts'

// QR de cobro con el logo de la carrera al centro (logoQrUrl del backend).
// Nivel H: tolera ~30% tapado, y el logo ocupa bastante menos.
export default function QrPago({ payload, imageUrl, logoUrl, size = 248, nombre = 'qr-pago' }) {
  const lienzo = useRef(null)
  const [sinDescarga, setSinDescarga] = useState(false)

  function descargar() {
    try {
      const a = document.createElement('a')
      a.href = lienzo.current.toDataURL('image/png')
      a.download = `${nombre}.png`
      a.click()
    } catch {
      setSinDescarga(true) // el logo vino de otro origen sin CORS: el lienzo queda "manchado"
    }
  }

  const logo = logoUrl && { src: logoUrl, height: Math.round(size * 0.24), width: Math.round(size * 0.24), excavate: true, crossOrigin: 'anonymous' }

  return (
    <div className="rn-qr">
      <div className="rn-qr-frame">
        <span className="rn-qr-corner tl" /><span className="rn-qr-corner tr" />
        <span className="rn-qr-corner bl" /><span className="rn-qr-corner br" />
        <div className="rn-qr-paper">
          {payload ? (
            <QRCodeCanvas
              ref={lienzo}
              value={payload}
              size={size}
              level="H"
              marginSize={0}
              fgColor="#2E1065"
              bgColor="#FFFFFF"
              imageSettings={logo || undefined}
              role="img"
              aria-label="Código QR de pago"
            />
          ) : (
            <img src={imageUrl} alt="Código QR de pago" width={size} height={size} />
          )}
          {logo && <span className="rn-qr-logo-ring" style={{ width: logo.width + 10, height: logo.height + 10 }} aria-hidden="true" />}
          <span className="rn-qr-scan" aria-hidden="true" />
        </div>
      </div>
      {payload && !sinDescarga && (
        <button type="button" className="rn-btn is-ghost is-sm" onClick={descargar}>
          <Icon name="download" size={16} />Guardar QR en el celular
        </button>
      )}
    </div>
  )
}
