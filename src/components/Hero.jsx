export default function Hero({ onAcceso }) {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-circle hero-circle-1" />
        <div className="hero-circle hero-circle-2" />
        <div className="hero-circle hero-circle-3" />
      </div>
      <div className="hero-content">
        <span className="hero-eyebrow">🏃‍♀️ CAM · Maratón de la Mujer</span>
        <h1 className="hero-title">
          Corre por tu poder.<br />
          <span className="hero-title-accent">Corre por tu causa.</span>
        </h1>
        <p className="hero-subtitle">
          Únete a la maratón solidaria del Centro de Apoyo a la Mujer. Cada kilómetro que corres
          contribuye a apoyar a mujeres que necesitan acompañamiento, orientación y una comunidad.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => onAcceso?.()}>
            Inscríbete ahora ✨
          </button>
          <a className="btn-ghost" href="#nosotras">
            Conoce más →
          </a>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-item">
            <strong>2</strong><span>Distancias</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <strong>5K &amp; 10K</strong><span>Para todas</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <strong>💜</strong><span>Por el CAM</span>
          </div>
        </div>
      </div>
      <div className="hero-wave">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#ffffff" />
        </svg>
      </div>
    </section>
  )
}
