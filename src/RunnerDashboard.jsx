import { useState, useEffect } from 'react'
import { getMarathons, getMe, createRegistration, checkoutRegistration } from './api'

export default function RunnerDashboard({ sesion }) {
  const [marathon, setMarathon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    fullName: sesion.user.name || '',
    docId: '',
    phone: '',
    email: sesion.user.email || '',
  })

  useEffect(() => {
    async function fetchDatos() {
      try {
        const [maratones, me] = await Promise.all([getMarathons(), getMe(sesion.accessToken)])
        const abierta = maratones.find(m => m.registrationStatus === 'open' || m.registrationStatus === 'closing_soon')
        if (abierta) setMarathon(abierta)
        setFormData(prev => ({ ...prev, fullName: me.name, email: me.email }))
      } catch (err) {
        setError('Error cargando datos: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDatos()
  }, [sesion.accessToken])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const personalData = { fullName: formData.fullName, docId: formData.docId, phone: formData.phone || undefined }
      const reg = await createRegistration(marathon.id, personalData, sesion.accessToken)
      await checkoutRegistration(reg.id, sesion.accessToken)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="dashboard">
      <div className="dash-loading full-loading"><span>Cargando tu panel…</span></div>
    </div>
  )

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>🏃‍♀️ ¡Hola, {sesion.user.name}!</h1>
          <p>Bienvenida a tu panel de corredora · CAM Maratón de la Mujer</p>
        </div>
      </div>

      <div className="dashboard-body container">
        {success ? (
          <div className="dash-card dash-success">
            <div className="success-big-icon">🎉</div>
            <h2>¡Inscripción enviada!</h2>
            <p>Tu inscripción a <strong>{marathon?.name}</strong> está pendiente de confirmación por el equipo del CAM. Te notificaremos pronto.</p>
            <p className="success-msg">¡Gracias por apoyar al Centro de Apoyo a la Mujer! Cada kilómetro que corres hace la diferencia. 💜</p>
            <button className="btn-primary" onClick={() => setSuccess(false)}>Volver al panel</button>
          </div>
        ) : marathon ? (
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>📋 Inscripción a {marathon.name}</h2>
              <span className="open-badge">Inscripciones abiertas</span>
            </div>
            <p className="dash-desc">Completa tus datos para inscribirte. El pago se realiza por transferencia bancaria y será confirmado manualmente por el equipo.</p>
            <form className="dash-form" onSubmit={handleSubmit}>
              <div className="dash-form-grid">
                <label>
                  Nombre completo
                  <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="Tu nombre completo" />
                </label>
                <label>
                  Carnet de Identidad (CI)
                  <input type="text" name="docId" required value={formData.docId} onChange={handleChange} placeholder="Tu número de CI" />
                </label>
                <label>
                  Celular
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="Tu número de celular" />
                </label>
                <label>
                  Correo electrónico
                  <input type="email" name="email" value={formData.email} disabled />
                </label>
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn-primary dash-submit" disabled={submitting}>
                {submitting ? 'Enviando…' : '✓ Inscribirme y generar pago'}
              </button>
            </form>
          </div>
        ) : (
          <div className="dash-card dash-empty-state">
            <div className="success-big-icon">🏁</div>
            <h2>Sin eventos abiertos</h2>
            <p>No hay maratones con inscripciones abiertas en este momento. Sigue atenta a nuestras redes sociales para conocer la próxima fecha. ¡Te esperamos!</p>
          </div>
        )}
      </div>
    </div>
  )
}
