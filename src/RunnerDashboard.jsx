import { useState, useEffect } from 'react'
import { getMarathons, getMe, createRegistration, checkoutRegistration } from './api'

export default function RunnerDashboard({ sesion }) {
  const [marathons, setMarathons] = useState([])
  const [selectedMarathon, setSelectedMarathon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    fullName: sesion.user.name || '',
    docId: '',
    phone: '',
    email: sesion.user.email || '',
    knowsCam: null,
    acceptsDonorCall: null,
  })

  useEffect(() => {
    async function fetchDatos() {
      try {
        const [maratones, me] = await Promise.all([getMarathons(), getMe(sesion.accessToken)])
        const abiertas = maratones.filter(m => m.registrationStatus === 'open' || m.registrationStatus === 'closing_soon')
        setMarathons(abiertas)
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

  function handleRadio(name, value) {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!selectedMarathon) {
      setError('Por favor selecciona una maratón')
      return
    }
    
    if (formData.knowsCam === null || formData.acceptsDonorCall === null) {
      setError('Por favor responde las dos preguntas del CAM')
      return
    }
    
    setSubmitting(true)
    setError(null)
    try {
      const personalData = {
        fullName: formData.fullName,
        docId: formData.docId,
        phone: formData.phone,
        email: formData.email || undefined,
        knowsCam: formData.knowsCam,
        acceptsDonorCall: formData.acceptsDonorCall,
      }
      const reg = await createRegistration(selectedMarathon.id, personalData, sesion.accessToken)
      const checkout = await checkoutRegistration(reg.id, sesion.accessToken)
      
      setPaymentInfo({
        amountCents: checkout.payment.amountCents,
        currency: checkout.payment.currency,
        methodDetails: checkout.payment.methodDetails,
        status: checkout.payment.status,
      })
      
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
        {success && paymentInfo ? (
          <div className="dash-card dash-success">
            <div className="success-big-icon">✅</div>
            <h2>¡Inscripción registrada!</h2>
            <p>Tu inscripción a <strong>{selectedMarathon?.name}</strong> está pendiente de pago.</p>
            
            {paymentInfo.methodDetails?.manualQr && (
              <div className="payment-qr-section">
                <h3>📱 Paga con QR</h3>
                {paymentInfo.methodDetails.manualQr.imageUrl && (
                  <img 
                    src={paymentInfo.methodDetails.manualQr.imageUrl} 
                    alt="QR de pago" 
                    className="payment-qr-image"
                  />
                )}
                <p className="payment-amount">
                  Monto: <strong>{(paymentInfo.amountCents / 100).toFixed(2)} Bs</strong>
                </p>
                {paymentInfo.methodDetails.manualQr.instructions && (
                  <div className="payment-instructions">
                    <p>{paymentInfo.methodDetails.manualQr.instructions}</p>
                  </div>
                )}
              </div>
            )}

            {paymentInfo.methodDetails?.bank && (
              <div className="payment-bank-section">
                <h3>🏦 Transferencia bancaria</h3>
                <p><strong>{paymentInfo.methodDetails.bank.bankName}</strong></p>
                <p>Cuenta: {paymentInfo.methodDetails.bank.accountNumber}</p>
                <p>Monto: <strong>{(paymentInfo.amountCents / 100).toFixed(2)} Bs</strong></p>
                <p>Referencia: <code>{paymentInfo.methodDetails.bank.reference}</code></p>
              </div>
            )}

            <p className="success-msg">
              Tu inscripción se confirmará cuando el equipo del CAM verifique tu pago. 💜
            </p>
            <button className="btn-primary" onClick={() => { setSuccess(false); setSelectedMarathon(null); setPaymentInfo(null); }}>
              Volver al panel
            </button>
          </div>
        ) : marathons.length > 0 ? (
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>📋 Inscripción</h2>
              <span className="open-badge">{marathons.length} evento(s) disponible(s)</span>
            </div>
            <p className="dash-desc">Selecciona la maratón a la que quieres inscribirte y completa tus datos.</p>
            
            {!selectedMarathon ? (
              <div className="marathon-selector">
                <h3>Elige tu maratón:</h3>
                <div className="marathon-list">
                  {marathons.map(m => (
                    <button
                      key={m.id}
                      className="marathon-card"
                      onClick={() => setSelectedMarathon(m)}
                    >
                      <div className="marathon-card-name">{m.name}</div>
                      <div className="marathon-card-info">
                        <span>📍 {m.city}</span>
                        <span>📅 {new Date(m.startsAt).toLocaleDateString()}</span>
                        <span>💰 {(m.priceCents / 100).toFixed(2)} Bs</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="selected-marathon-bar">
                  <span>📋 {selectedMarathon.name}</span>
                  <button className="btn-outline-sm" onClick={() => setSelectedMarathon(null)}>
                    Cambiar
                  </button>
                </div>
                <form className="dash-form" onSubmit={handleSubmit}>
                  <div className="dash-form-grid">
                    <label>
                      Nombre completo *
                      <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="Tu nombre completo" />
                    </label>
                    <label>
                      Carnet de Identidad (CI) *
                      <input type="text" name="docId" required value={formData.docId} onChange={handleChange} placeholder="Tu número de CI" />
                    </label>
                    <label>
                      Celular *
                      <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="Tu número de celular" />
                    </label>
                    <label>
                      Correo electrónico
                      <input type="email" name="email" value={formData.email} disabled />
                    </label>
                  </div>

                  <div className="cam-questions">
                    <h3>💜 Preguntas del CAM</h3>
                    
                    <div className="cam-question">
                      <p className="cam-question-label">¿Conoce usted el trabajo del CAM? *</p>
                      <div className="cam-options">
                        <label className="cam-option">
                          <input type="radio" name="knowsCam" checked={formData.knowsCam === true} onChange={() => handleRadio('knowsCam', true)} />
                          Sí
                        </label>
                        <label className="cam-option">
                          <input type="radio" name="knowsCam" checked={formData.knowsCam === false} onChange={() => handleRadio('knowsCam', false)} />
                          No
                        </label>
                      </div>
                    </div>

                    <div className="cam-question">
                      <p className="cam-question-label">¿Acepta que le llamemos para la oportunidad de ser un donador del CAM? *</p>
                      <div className="cam-options">
                        <label className="cam-option">
                          <input type="radio" name="acceptsDonorCall" checked={formData.acceptsDonorCall === true} onChange={() => handleRadio('acceptsDonorCall', true)} />
                          Sí
                        </label>
                        <label className="cam-option">
                          <input type="radio" name="acceptsDonorCall" checked={formData.acceptsDonorCall === false} onChange={() => handleRadio('acceptsDonorCall', false)} />
                          No
                        </label>
                      </div>
                    </div>
                  </div>

                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="btn-primary dash-submit" disabled={submitting}>
                    {submitting ? 'Enviando…' : '✓ Inscribirme y generar pago'}
                  </button>
                </form>
              </>
            )}
          </div>
        ) : (
          <div className="dash-card dash-empty-state">
            <div className="success-big-icon">🏁</div>
            <h2>Sin eventos abiertos</h2>
            <p>No hay maratones con inscripciones abiertas en este momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
