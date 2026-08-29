const TESTIMONIOS = [
  {
    nombre: 'María González',
    inicial: 'M',
    color: '#E91E63',
    texto: 'Correr la maratón fue un reto personal enorme. Nunca imaginé completar los 10K, pero el ambiente, la seguridad y la organización me impulsaron a lograrlo.',
  },
  {
    nombre: 'Ana Rodríguez',
    inicial: 'A',
    color: '#7B2FBE',
    texto: 'Participar apoyando al CAM le dio un propósito distinto a mi carrera. Es increíble ver a tantas mujeres unidas por una misma causa solidaria.',
  },
  {
    nombre: 'Lucía Flores',
    inicial: 'L',
    color: '#F4C542',
    texto: 'Excelente logística y un ambiente muy seguro para todas. Es mucho más que un evento deportivo, es un espacio donde realmente te sientes acompañada.',
  },
  {
    nombre: 'Carmen Pérez',
    inicial: 'C',
    color: '#E91E63',
    texto: 'Conocí el trabajo del CAM hace tiempo y quería aportar. Los 5K fueron mi primera experiencia en running y definitivamente volveré en la próxima edición.',
  },
]

export default function Testimonials() {
  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Experiencias</span>
          <h2 className="section-title">Lo que dicen nuestras corredoras</h2>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIOS.map(t => (
            <article key={t.nombre} className="testimonial-card">
              <div className="stars" style={{ color: 'var(--gold)', letterSpacing: '2px' }}>★★★★★</div>
              <p className="testimonial-text">"{t.texto}"</p>
              <div className="testimonial-author">
                <div className="avatar" style={{ background: t.color }}>{t.inicial}</div>
                <strong>{t.nombre}</strong>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}