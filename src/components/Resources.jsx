const RECURSOS = [
  {
    icon: '01',
    titulo: 'Plan de entrenamiento',
    desc: 'Guías de entrenamiento estructuradas para diferentes niveles físicos. Empieza a prepararte de forma segura.',
    tag: 'Próximamente',
  },
  {
    icon: '02',
    titulo: 'Nutrición deportiva',
    desc: 'Pautas de alimentación adaptadas a las exigencias de la carrera, enfocadas en mejorar tu rendimiento y recuperación.',
    tag: 'Próximamente',
  },
  {
    icon: '03',
    titulo: 'Preparación integral',
    desc: 'Materiales enfocados en la concentración, el manejo de la ansiedad pre-carrera y el bienestar emocional.',
    tag: 'Próximamente',
  },
]

export default function Resources() {
  return (
    <section id="recursos" className="resources-section">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Recursos</span>
          <h2 className="section-title">Preparación oficial</h2>
          <p className="section-subtitle">Material descargable diseñado por profesionales para acompañar tu proceso de entrenamiento.</p>
        </div>
        <div className="resources-grid">
          {RECURSOS.map(r => (
            <article key={r.titulo} className="resource-card">
              <div className="resource-icon" style={{ fontWeight: '800', color: 'var(--pink)', fontSize: '1.8rem' }}>{r.icon}</div>
              <span className="resource-tag">{r.tag}</span>
              <h3>{r.titulo}</h3>
              <p>{r.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}