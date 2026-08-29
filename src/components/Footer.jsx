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
              <div className="footer-logo">
                <strong>CAM · Maratón de la Mujer</strong>
              </div>
              <p>Corremos con propósito.</p>
              <p className="footer-mision">Un evento solidario del Centro de Apoyo a la Mujer destinado a financiar servicios de acompañamiento integral y gratuito.</p>
              <div className="footer-social">
                <a href="#" aria-label="Instagram" className="social-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="#" aria-label="Facebook" className="social-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="#" aria-label="YouTube" className="social-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                </a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Navegación</h4>
              <ul>
                <li><a href="#top">Inicio</a></li>
                <li><a href="#nosotras">Nuestra Labor</a></li>
                <li><a href="#carreras">Modalidades</a></li>
                <li><a href="#recursos">Recursos</a></li>
                <li><a href="#contacto">Contacto</a></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Categorías</h4>
              <ul>
                <li><a href="#carreras">5K · Carrera Solidaria</a></li>
                <li><a href="#carreras">10K · Carrera Competitiva</a></li>
              </ul>
              <h4 style={{ marginTop: '1.5rem' }}>Portal Web</h4>
              <ul>
                <li><button className="footer-link-btn" onClick={() => onAcceso?.()}>Iniciar sesión</button></li>
                <li><button className="footer-link-btn" onClick={() => onAcceso?.()}>Crear cuenta</button></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Centro de Apoyo a la Mujer (CAM). Todos los derechos reservados.</span>
            <span>Desarrollado para el apoyo integral de la mujer.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}