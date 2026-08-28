const VALORES = [
  { icon: '💜', title: 'Solidaridad', text: 'Nos apoyamos mutuamente en cada paso del camino.' },
  { icon: '🏃‍♀️', title: 'Salud', text: 'Promovemos el bienestar físico y emocional de la mujer.' },
  { icon: '⚡', title: 'Empoderamiento', text: 'Cada carrera es un acto de fuerza y transformación.' },
  { icon: '🤝', title: 'Comunidad', text: 'Juntas somos más fuertes. Ninguna mujer corre sola.' },
]

export default function AboutUs() {
  return (
    <section id="nosotras" className="about-section">
      <div className="container">
        <div className="about-grid">
          <div className="about-text">
            <span className="section-eyebrow">Quiénes somos</span>
            <h2 className="section-title">El Centro de Apoyo<br />a la Mujer</h2>
            <p className="about-desc">
              El <strong>CAM</strong> es un espacio de acompañamiento, orientación legal y apoyo emocional
              para mujeres que han vivido situaciones de violencia. Nuestra Maratón de la Mujer es
              nuestra actividad de recaudación de fondos para seguir brindando estos servicios
              <strong> de forma gratuita</strong>.
            </p>
            <p className="about-desc">
              Al inscribirte y correr, no solo cuidas tu salud: contribuís directamente a que más
              mujeres tengan acceso a nuestros servicios. <strong>Cada paso cuenta.</strong>
            </p>
            <div className="about-badge">
              <span>🎯</span>
              <div>
                <strong>100% de los fondos</strong>
                <span>van al programa de acompañamiento del CAM</span>
              </div>
            </div>
          </div>
          <div className="values-grid">
            {VALORES.map(v => (
              <article key={v.title} className="value-card">
                <div className="value-icon">{v.icon}</div>
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
