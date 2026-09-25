import { useEffect, useState } from 'react'
import { getMarathons, getMarathon } from '../api'

const fecha = iso => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
const distancia = m => (m % 1000 === 0 ? `${m / 1000}K` : `${(m / 1000).toFixed(1)}K`)

export default function Races({ onAcceso }) {
  const [carreras, setCarreras] = useState(null)

  useEffect(() => {
    // ponytail: un detalle por maraton (N+1) porque el listado no trae description; sumarla a CAMPOS_RESUMEN en la API si crecen
    getMarathons()
      .then(ms => Promise.all(ms.map(m => getMarathon(m.slug).catch(() => m))))
      .then(setCarreras)
      .catch(() => setCarreras([]))
  }, [])

  return (
    <section id="carreras" className="races-section">
      <div className="races-bg" />
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Carreras</span>
          <h2 className="section-title">Elige tu carrera</h2>
          <p className="section-subtitle">Opciones adaptadas a diferentes niveles de preparación física. Tu participación es lo que realmente importa.</p>
        </div>
        {carreras === null && <p className="section-subtitle">Cargando carreras…</p>}
        {carreras?.length === 0 && <p className="section-subtitle">Pronto anunciaremos nuevas carreras.</p>}
        <div className="races-grid">
          {carreras?.map(c => (
            <article key={c.id} className="race-card">
              <div
                className="race-card-top"
                style={c.coverUrl ? { background: `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.55)), url(${c.coverUrl}) center/cover` } : undefined}
              >
                <div className="race-dist">{distancia(c.distanceMeters)}</div>
                <span className="nivel-badge">{c.city}</span>
              </div>
              <div className="race-card-body">
                <h3>{c.name}</h3>
                {c.description && <p>{c.description}</p>}
                {Array.isArray(c.includes) && c.includes.length > 0 && (
                  <ul className="race-includes">
                    {c.includes.map(item => (
                      <li key={item}><span>✓</span> {item}</li>
                    ))}
                  </ul>
                )}
                <div className="race-fecha">{fecha(c.startsAt)}</div>
                <button className="btn-primary race-btn" onClick={() => onAcceso?.()}>
                  Inscribirse
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
