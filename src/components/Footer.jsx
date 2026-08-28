export default function Footer({ onAcceso }) {
  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill="#1a0533" />
        </svg>
      </div>
      <div className="footer-body">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">🏃‍♀️ <strong>CAM · Maratón de la Mujer</strong></div>
              <p>Juntas corremos más lejos ❤️</p>
              <p className="footer-mision">Una actividad solidaria del Centro de Apoyo a la Mujer para seguir brindando acompañamiento gratuito a quienes más lo necesitan.</p>
              <div className="footer-social">
                <a href="#" aria-label="Instagram" className="social-btn">📸</a>
                <a href="#" aria-label="Facebook" className="social-btn">👥</a>
                <a href="#" aria-label="YouTube" className="social-btn">▶️</a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Navegación</h4>
              <ul>
                <li><a href="#top">Inicio</a></li>
                <li><a href="#nosotras">Nosotras</a></li>
                <li><a href="#carreras">Carreras</a></li>
                <li><a href="#recursos">Recursos</a></li>
                <li><a href="#contacto">Contacto</a></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Carreras</h4>
              <ul>
                <li><a href="#carreras">5K · Carrera Solidaria</a></li>
                <li><a href="#carreras">10K · Carrera del Empoderamiento</a></li>
              </ul>
              <h4 style={{ marginTop: '1.5rem' }}>Acceso</h4>
              <ul>
                <li><button className="footer-link-btn" onClick={() => onAcceso?.()}>Iniciar sesión</button></li>
                <li><button className="footer-link-btn" onClick={() => onAcceso?.()}>Registrarse</button></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 Centro de Apoyo a la Mujer · CAM</span>
            <span>Hecho con amor para todas las mujeres 💜</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
