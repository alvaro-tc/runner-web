import { useEffect, useState } from 'react'
import { getMarathons, getMarathon } from '../api'

const fecha = iso => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Races({ onAcceso }) {
  const [carreras, setCarreras] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // ponytail: un detalle por carrera (N+1) porque el listado no trae description; sumarla a CAMPOS_RESUMEN en la API si crecen
    setError(null)
    getMarathons()
      .then(ms => Promise.all(ms.map(m => getMarathon(m.slug).catch(() => m))))
      .then(setCarreras)
      .catch(err => {
        setError(err.message)
        setCarreras([])
      })
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
        {error && (
          <div className="races-error">
            <p>No pudimos cargar las carreras disponibles.</p>
            <small>{error}</small>
          </div>
        )}
        {carreras?.length === 0 && !error && <p className="section-subtitle">Pronto anunciaremos nuevas carreras.</p>}
        <div className="races-grid">
          {carreras?.map(c => (
            <article key={c.id} className={`race-card${c.registrationStatus === 'closed' ? ' race-card-closed' : ''}`}>
              <div
                className="race-card-top"
                style={c.coverUrl ? { background: `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.55)), url(${c.coverUrl}) center/cover` } : undefined}
              >
                <h3 className="race-name">{c.name}</h3>
                <span className="nivel-badge">{c.city}</span>
              </div>
              <div className="race-card-body">
                <span className={`race-status race-status-${c.registrationStatus || 'closed'}`}>
                  {c.registrationStatus === 'open' ? 'Inscripciones abiertas' : c.registrationStatus === 'closing_soon' ? 'Cierre próximo' : 'Inscripciones cerradas'}
                </span>
                {c.description && <p>{c.description}</p>}
                {Array.isArray(c.includes) && c.includes.length > 0 && (
                  <ul className="race-includes">
                    {c.includes.map(item => (
                      <li key={item}><span>✓</span> {item}</li>
                    ))}
                  </ul>
                )}
                <div className="race-fecha">{fecha(c.startsAt)}</div>
                <div className="race-meta">
                  <strong>{(c.priceCents / 100).toFixed(2)} {c.currency || 'BOB'}</strong>
                  <span>{c.slotsAvailable ?? '—'} cupos disponibles</span>
                </div>
                <button className="btn-primary race-btn" disabled={!['open', 'closing_soon'].includes(c.registrationStatus)} onClick={() => onAcceso?.()}>
                  {['open', 'closing_soon'].includes(c.registrationStatus) ? 'Inscribirse' : 'No disponible'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
