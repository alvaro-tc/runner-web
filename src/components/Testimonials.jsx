const TESTIMONIOS = [
  {
    nombre: 'María González',
    inicial: 'M',
    color: '#E91E63',
    texto: 'Correr en la Maratón de la Mujer fue una experiencia transformadora. Nunca pensé que podría hacer los 10K, pero el apoyo de las demás participantes me dio fuerzas.',
  },
  {
    nombre: 'Ana Rodríguez',
    inicial: 'A',
    color: '#7B2FBE',
    texto: 'Me inscribí por la causa del CAM y terminé enamorándome del running. Saber que cada paso ayuda a otras mujeres le da un significado especial a cada carrera.',
  },
  {
    nombre: 'Lucía Flores',
    inicial: 'L',
    color: '#F4C542',
    texto: 'La energía de este evento es única. Mujeres de todas las edades corriendo juntas, apoyándose. Es más que una carrera: es una celebración de la mujer.',
  },
  {
    nombre: 'Carmen Pérez',
    inicial: 'C',
    color: '#E91E63',
    texto: 'El CAM cambió mi vida y quise devolver algo. Participé en los 5K y fue el primer paso de muchos. ¡Ya me estoy entrenando para los 10K del próximo año!',
  },
]

export default function Testimonials() {
  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Testimonios</span>
          <h2 className="section-title">Lo que dicen nuestras corredoras</h2>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIOS.map(t => (
            <article key={t.nombre} className="testimonial-card">
              <div className="stars">⭐⭐⭐⭐⭐</div>
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
