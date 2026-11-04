import { useLayoutEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const TINTA = '#8B5CF6'

// Copia de BrandedQr (app movil): violeta sobre blanco, ojos circulares y el
// logo de la carrera ENCIMA del codigo, no dentro del lienzo, asi /uploads no
// necesita CORS. Nivel H: aguanta ~30% tapado y el logo ocupa menos.
export default function QrPago({ payload, imageUrl, logoUrl, size = 240 }) {
  const svg = useRef(null)
  const [n, setN] = useState(0) // modulos por lado, para ubicar los ojos

  useLayoutEffect(() => {
    const vb = svg.current?.getAttribute('viewBox')?.split(' ')
    if (vb) setN(Number(vb[2]))
  }, [payload])

  const ojos = n ? [[0, 0], [n - 7, 0], [0, n - 7]] : []
  const lado = Math.round(size * 0.24)

  return (
    <div className="rn-qr">
      <div className="rn-qr-card" style={{ width: size + 40 }}>
        {payload ? (
          <div className="rn-qr-code" style={{ width: size, height: size }}>
            <QRCodeSVG ref={svg} value={payload} size={size} level="H" marginSize={0} fgColor={TINTA} bgColor="#FFFFFF" role="img" aria-label="Código QR de pago" />
            {n > 0 && (
              <svg className="rn-qr-eyes" viewBox={`0 0 ${n} ${n}`} width={size} height={size} aria-hidden="true">
                {ojos.map(([x, y]) => (
                  <g key={`${x}-${y}`}>
                    <rect x={x} y={y} width="7" height="7" fill="#fff" />
                    <circle cx={x + 3.5} cy={y + 3.5} r="3" fill="none" stroke={TINTA} strokeWidth="1" />
                    <circle cx={x + 3.5} cy={y + 3.5} r="1.5" fill={TINTA} />
                  </g>
                ))}
              </svg>
            )}
            {logoUrl && (
              <span className="rn-qr-logo" style={{ width: lado, height: lado, padding: lado * 0.08 }}>
                <img src={logoUrl} alt="" onError={e => (e.currentTarget.parentElement.hidden = true)} />
              </span>
            )}
          </div>
        ) : (
          <img src={imageUrl} alt="Código QR de pago" width={size} height={size} />
        )}
      </div>
    </div>
  )
}
