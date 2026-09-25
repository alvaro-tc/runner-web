import { APK_URL } from '../api'

export default function Hero({ onAcceso }) {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-circle hero-circle-1" />
        <div className="hero-circle hero-circle-2" />
        <div className="hero-circle hero-circle-3" />
      </div>
      <div className="hero-content">
        <span className="hero-eyebrow">CAM · Maratón de la Mujer</span>
        <h1 className="hero-title">
          Corre por tu poder.<br />
          <span className="hero-title-accent">Corre por tu causa.</span>
        </h1>
        <p className="hero-subtitle">
          Únete a la maratón solidaria del Centro de Apoyo a la Mujer. Cada kilómetro recorrido contribuye a brindar acompañamiento y orientación a mujeres en situación de vulnerabilidad.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => onAcceso?.()}>
            Inscribirme ahora
          </button>
          <a className="btn-ghost" href="#nosotras">
            Conocer más
          </a>
        </div>
        <div className="hero-app">
          <img src="/app-qr.svg" alt="QR para descargar la app de Android" width="120" height="120" />
          <div>
            <p>Escanea el QR o descarga la app para Android</p>
            <a className="btn-primary" href={APK_URL}>Descargar aquí (.apk)</a>
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