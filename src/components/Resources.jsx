const RECURSOS = [
  {
    icon: '🏃‍♀️',
    titulo: 'Plan de entrenamiento',
    desc: 'Guías de entrenamiento diseñadas para mujeres de todos los niveles. Desde cero hasta completar tu primera carrera.',
    tag: 'Próximamente',
  },
  {
    icon: '🥗',
    titulo: 'Nutrición para corredoras',
    desc: 'Consejos de alimentación adaptados a las necesidades de la mujer deportista. Come bien, corre mejor.',
    tag: 'Próximamente',
  },
  {
    icon: '🧘‍♀️',
    titulo: 'Bienestar emocional',
    desc: 'Recursos sobre salud mental, manejo del estrés y el running como herramienta de empoderamiento personal.',
    tag: 'Próximamente',
  },
]

export default function Resources() {
  return (
    <section id="recursos" className="resources-section">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Recursos</span>
          <h2 className="section-title">Para corredoras de todos los niveles</h2>
          <p className="section-subtitle">Materiales de apoyo para que llegues a la línea de llegada en tu mejor forma</p>
        </div>
        <div className="resources-grid">
          {RECURSOS.map(r => (
            <article key={r.titulo} className="resource-card">
              <div className="resource-icon">{r.icon}</div>
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
