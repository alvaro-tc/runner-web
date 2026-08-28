import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' })
  const [enviado, setEnviado] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setEnviado(true)
  }

  return (
    <section id="contacto" className="contact-section">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info">
            <span className="section-eyebrow">Contacto</span>
            <h2 className="section-title">¿Tienes dudas?<br />Escríbenos</h2>
            <p>Estamos para apoyarte en cada paso. Si tienes preguntas sobre las carreras, la inscripción o el CAM, no dudes en escribirnos.</p>
            <div className="contact-items">
              <div className="contact-item">
                <span>📧</span><span>contacto@cam-maraton.org</span>
              </div>
              <div className="contact-item">
                <span>📞</span><span>Línea de ayuda disponible todos los días</span>
              </div>
              <div className="contact-item">
                <span>📍</span><span>Centro de Apoyo a la Mujer - CAM</span>
              </div>
            </div>
          </div>
          <div className="contact-form-wrap">
            {enviado ? (
              <div className="contact-success">
                <div className="success-icon">💜</div>
                <h3>¡Mensaje recibido!</h3>
                <p>Gracias por escribirnos. Te responderemos pronto.</p>
                <button className="btn-secondary" onClick={() => { setEnviado(false); setForm({ nombre: '', email: '', mensaje: '' }) }}>
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <label>
                  Nombre completo
                  <input type="text" name="nombre" required value={form.nombre} onChange={handleChange} placeholder="Tu nombre" />
                </label>
                <label>
                  Correo electrónico
                  <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="tu@correo.com" />
                </label>
                <label>
                  Mensaje
                  <textarea name="mensaje" required rows={4} value={form.mensaje} onChange={handleChange} placeholder="¿En qué podemos ayudarte?" />
                </label>
                <button type="submit" className="btn-primary">
                  Enviar mensaje 💜
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
