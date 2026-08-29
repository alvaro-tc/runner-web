const VALORES = [
  { icon: '01', title: 'Solidaridad', text: 'Construimos una red de apoyo mutuo para cada participante y beneficiaria.' },
  { icon: '02', title: 'Salud Integral', text: 'Promovemos el bienestar físico, psicológico y emocional de la mujer.' },
  { icon: '03', title: 'Autonomía', text: 'Fomentamos la confianza y el desarrollo personal a través del deporte.' },
  { icon: '04', title: 'Comunidad', text: 'Creamos espacios seguros y de contención donde nadie corre sola.' },
]

export default function AboutUs() {
  return (
    <section id="nosotras" className="about-section">
      <div className="container">
        <div className="about-grid">
          <div className="about-text">
            <span className="section-eyebrow">Nuestra Labor</span>
            <h2 className="section-title">El Centro de Apoyo<br />a la Mujer</h2>
            <p className="about-desc">
              El <strong>CAM</strong> es un espacio de acompañamiento, orientación legal y apoyo psicológico
              para mujeres en situación de vulnerabilidad. La Maratón de la Mujer es
              nuestro principal evento de recaudación para sostener y expandir estos servicios
              <strong> de forma gratuita</strong>.
            </p>
            <p className="about-desc">
              Al inscribirte, no solo participas en un evento deportivo, sino que financias directamente
              el acceso a asistencia profesional para quienes más lo necesitan.
            </p>
            <div className="about-badge">
              <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--pink)' }}>+</span>
              <div>
                <strong>100% de los fondos recaudados</strong>
                <span>Se destinan a los programas de intervención del CAM</span>
              </div>
            </div>
          </div>
          <div className="values-grid">
            {VALORES.map(v => (
              <article key={v.title} className="value-card">
                <div className="value-icon" style={{ fontWeight: '800', color: 'var(--pink-light)', fontSize: '1.5rem' }}>{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}