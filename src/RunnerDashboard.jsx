import { useState, useEffect } from 'react'
import { getMarathons, getMe, createRegistration, checkoutRegistration } from './api'

export default function RunnerDashboard({ sesion }) {
  const [marathon, setMarathon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Campos del formulario. Se prellenan con los datos que el usuario ya
  // tiene guardados en la BD (nombre y correo); el resto son propios de la
  // inscripción a la carrera y no viven en el perfil.
  const [formData, setFormData] = useState({
    fullName: sesion.user.name || '',
    docId: '',
    phone: '',
    email: sesion.user.email || '',
  })

  useEffect(() => {
    async function fetchDatos() {
      try {
        const [maratones, me] = await Promise.all([
          getMarathons(),
          getMe(sesion.accessToken),
        ])
        // Elegimos la primera que todavia acepta inscripciones.
        const abierta = maratones.find(
          (m) => m.registrationStatus === 'open' || m.registrationStatus === 'closing_soon',
        )
        if (abierta) setMarathon(abierta)
        setFormData((prev) => ({ ...prev, fullName: me.name, email: me.email }))
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const personalData = {
        fullName: formData.fullName,
        docId: formData.docId,
        phone: formData.phone || undefined,
      }

      const reg = await createRegistration(marathon.id, personalData, sesion.accessToken)
      // Simular selección de extras y hacer checkout manual por transferencia
      await checkoutRegistration(reg.id, sesion.accessToken)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="card state-card">Cargando…</div>

  return (
    <div className="dashboard">
      <div className="page-title">
        <h2>Panel de corredor/a</h2>
      </div>

      {success ? (
        <div className="card state-card">
          <div className="state-icon">✅</div>
          <h3>¡Inscripción enviada!</h3>
          <p>Tu inscripción está pendiente de confirmación por el organizador.</p>
          <button className="btn btn-primary" onClick={() => setSuccess(false)}>Volver</button>
        </div>
      ) : marathon ? (
        <form className="card" onSubmit={handleSubmit}>
          <h3>Inscripción a: {marathon.name}</h3>

          <label>
            Nombre completo
            <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} />
          </label>

          <label>
            Carnet de Identidad (CI)
            <input type="text" name="docId" required value={formData.docId} onChange={handleChange} />
          </label>

          <label>
            Celular
            <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} />
          </label>

          <label>
            Correo electrónico
            <input type="email" name="email" value={formData.email} disabled />
          </label>

          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Inscribirse y generar pago'}
          </button>
        </form>
      ) : (
        <div className="card state-card">
          <div className="state-icon">🏁</div>
          <h3>Sin eventos abiertos</h3>
          <p>No hay maratones aceptando inscripciones en este momento.</p>
        </div>
      )}
    </div>
  )
}
