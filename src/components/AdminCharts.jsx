import { useState } from 'react'

// Gráficos del panel en SVG/CSS propio: son cuatro formas simples y una librería pesaría más que todo el panel.

const ICONOS = {
  chart: 'M3 3v18h18M7 15l4-4 3 3 6-6',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  plus: 'M12 5v14M5 12h14',
  chevron: 'm6 9 6 6 6-6',
  search: 'm21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  coins: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  flag: 'M4 22V4s1-1 4-1 5 2 8 2 4-1 4-1v11s-1 1-4 1-5-2-8-2-4 1-4 1',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01',
  ticket: 'M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2ZM13 5v2M13 17v2M13 11v2',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  package: 'm7.5 4.3 9 5.2M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7ZM3.3 7 12 12l8.7-5M12 22V12',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM21 15l-5-5L5 21',
  qr: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h3v3h-3ZM20 14v.01M14 20h.01M17 17h4v4h-4',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  receipt: 'M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2ZM8 8h8M8 12h8M8 16h5',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  heart: 'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z',
  trend: 'M22 7 13.5 15.5l-5-5L2 17M16 7h6v6',
}

export function Icon({ name, size = 18, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      <path d={ICONOS[name]} />
    </svg>
  )
}

/// Línea mínima para las tarjetas KPI: solo la forma, el número grande cuenta el resto.
export function Sparkline({ values, label }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - (v / max) * 26}`).join(' ')
  return (
    <svg className="ad-spark" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={label}>
      <polygon points={`0,32 ${pts} 100,32`} className="ad-spark-area" />
      <polyline points={pts} className="ad-spark-line" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const fechaCorta = iso => new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/// Barras por día + línea del acumulado. Barras en HTML (se adaptan al ancho sin deformar texto),
/// la línea en SVG estirado con trazo que no se escala.
export function DailyChart({ data, modo, formato }) {
  const [activo, setActivo] = useState(null)
  const valores = data.map(d => modo === 'dinero' ? d.revenueCents : d.confirmed)
  const max = Math.max(...valores, 1)
  let suma = 0
  const acumulado = valores.map(v => (suma += v))
  const total = suma || 1
  const linea = acumulado.map((v, i) => `${data.length === 1 ? 50 : (i / (data.length - 1)) * 100},${100 - (v / total) * 100}`).join(' ')
  const cada = Math.max(1, Math.ceil(data.length / 8))
  const d = activo === null ? null : data[activo]

  return (
    <figure className="ad-daily" aria-label={`${modo === 'dinero' ? 'Recaudado' : 'Inscritas'} por día, ${data.length} días`}>
      <div className="ad-daily-plot" onMouseLeave={() => setActivo(null)}>
        <div className="ad-daily-grid" aria-hidden="true"><span /><span /><span /></div>
        <div className="ad-daily-bars">
          {data.map((p, i) => (
            <button key={p.date} type="button" className={`ad-bar${activo === i ? ' is-on' : ''}`}
              style={{ '--h': `${(valores[i] / max) * 100}%` }}
              onMouseEnter={() => setActivo(i)} onFocus={() => setActivo(i)} onBlur={() => setActivo(null)}
              aria-label={`${fechaCorta(p.date)}: ${formato(valores[i])}, acumulado ${formato(acumulado[i])}`} />
          ))}
        </div>
        <svg className="ad-daily-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={linea} vectorEffect="non-scaling-stroke" />
        </svg>
        {d && (
          <div className="ad-tip" style={{ left: `${((activo + .5) / data.length) * 100}%` }} role="status">
            <strong>{fechaCorta(d.date)}</strong>
            <span><i className="ad-dot" /> {formato(valores[activo])} ese día</span>
            <span><i className="ad-dot is-line" /> {formato(acumulado[activo])} acumulado</span>
          </div>
        )}
      </div>
      <div className="ad-daily-axis" aria-hidden="true">
        {data.map((p, i) => <span key={p.date}>{i % cada === 0 ? fechaCorta(p.date) : ''}</span>)}
      </div>
    </figure>
  )
}

/// Dona de dos o tres porciones con su leyenda en texto (el color nunca va solo).
export function Donut({ partes, centro, label }) {
  const total = partes.reduce((s, p) => s + p.value, 0)
  const R = 15.9155 // circunferencia 100: los porcentajes van directo al dasharray
  let offset = 25
  return (
    <div className="ad-donut">
      <svg viewBox="0 0 42 42" role="img" aria-label={`${label}: ${partes.map(p => `${p.label} ${p.value}`).join(', ')}`}>
        <circle cx="21" cy="21" r={R} className="ad-donut-bg" />
        {total > 0 && partes.map(p => {
          const pct = (p.value / total) * 100
          const el = <circle key={p.label} cx="21" cy="21" r={R} className="ad-donut-seg" stroke={p.color}
            strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />
          offset -= pct
          return el
        })}
        <text x="21" y="21" className="ad-donut-n">{centro}</text>
      </svg>
      <ul className="ad-legend">
        {partes.map(p => (
          <li key={p.label}><i style={{ background: p.color }} />{p.label}
            <b>{total ? Math.round((p.value / total) * 100) : 0}%</b></li>
        ))}
      </ul>
    </div>
  )
}

/// Barras horizontales con el valor al lado: edades, categorías.
export function HBars({ filas }) {
  const max = Math.max(...filas.map(f => f.value), 1)
  return (
    <ul className="ad-hbars">
      {filas.map(f => (
        <li key={f.label}>
          <span className="ad-hbars-l">{f.label}</span>
          <span className="ad-hbars-t"><span style={{ width: `${(f.value / max) * 100}%` }} /></span>
          <b>{f.value.toLocaleString('es-BO')}</b>
        </li>
      ))}
    </ul>
  )
}

/// Embudo: cada paso con su ancho relativo al primero y la tasa contra el anterior.
export function Funnel({ pasos }) {
  const base = Math.max(pasos[0]?.value || 0, 1)
  return (
    <ol className="ad-funnel">
      {pasos.map((p, i) => {
        const prev = pasos[i - 1]?.value
        const tasa = i > 0 && prev ? Math.min(100, (p.value / prev) * 100) : null
        return (
          <li key={p.label}>
            <div className="ad-funnel-head">
              <span>{p.label}</span>
              <b>{p.value.toLocaleString('es-BO')}</b>
            </div>
            <div className="ad-funnel-t"><span style={{ width: `${Math.max(2, Math.min(100, (p.value / base) * 100))}%` }} /></div>
            {tasa !== null && <small>{tasa.toFixed(tasa < 10 ? 1 : 0)}% del paso anterior</small>}
          </li>
        )
      })}
    </ol>
  )
}
