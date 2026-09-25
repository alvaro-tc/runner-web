import { useEffect, useState } from 'react'
import {
  checkoutRegistration,
  createRegistration,
  getMarathons,
  getMe,
  getPayment,
  getPaymentReceipt,
  uploadPaymentProof,
} from './api'

const PAYMENT_LABEL = {
  pending: 'Pago pendiente de revisión',
  paid: 'Pago confirmado',
  failed: 'Pago rechazado o vencido',
  refunded: 'Pago reembolsado',
}

const PROOF_LABEL = {
  in_review: 'Comprobante en revisión',
  rejected: 'Comprobante rechazado',
  approved: 'Comprobante aprobado',
}

function formatMoney(payment) {
  return `${(payment.amountCents / 100).toFixed(2)} ${payment.currency}`
}

export default function RunnerDashboard({ sesion }) {
  const [marathon, setMarathon] = useState(null)
  const [payment, setPayment] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    fullName: sesion.user.name || '',
    docId: '',
    phone: '',
    email: sesion.user.email || '',
    reference: '',
    file: null,
  })

  useEffect(() => {
    const savedPayment = sessionStorage.getItem('runner.payment')
    if (!savedPayment) return

    try {
      setPayment(JSON.parse(savedPayment))
    } catch {
      sessionStorage.removeItem('runner.payment')
    }
  }, [])

  useEffect(() => {
    if (payment) sessionStorage.setItem('runner.payment', JSON.stringify(payment))
  }, [payment])

  useEffect(() => {
    async function fetchDatos() {
      try {
        const [maratones, me] = await Promise.all([getMarathons(), getMe(sesion.accessToken)])
        const abierta = maratones.find(
          (item) => item.registrationStatus === 'open' || item.registrationStatus === 'closing_soon',
        )
        if (abierta) setMarathon(abierta)
        setFormData((prev) => ({ ...prev, fullName: me.name, email: me.email }))
      } catch (err) {
        setError(`Error cargando datos: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    fetchDatos()
  }, [sesion.accessToken])

  useEffect(() => {
    if (!payment?.id || payment.status !== 'pending') return undefined

    const interval = window.setInterval(async () => {
      try {
        setPayment(await getPayment(payment.id, sesion.accessToken))
      } catch {
        // Una lectura fallida no borra el estado visible del corredor.
      }
    }, 5000)

    return () => window.clearInterval(interval)
  }, [payment?.id, payment?.status, sesion.accessToken])

  function handleChange(event) {
    const { name, value, files } = event.target
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const registration = await createRegistration(
        marathon.id,
        {
          fullName: formData.fullName,
          docId: formData.docId,
          phone: formData.phone || undefined,
        },
        sesion.accessToken,
      )
      const result = await checkoutRegistration(registration.id, sesion.accessToken)
      setPayment(result.payment)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!formData.file) return

    setUploading(true)
    setError(null)
    try {
      const proof = await uploadPaymentProof(
        payment.id,
        formData.file,
        formData.reference,
        sesion.accessToken,
      )
      setPayment((prev) => ({ ...prev, proof }))
      setFormData((prev) => ({ ...prev, file: null, reference: '' }))
      event.target.reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleReceipt() {
    setError(null)
    try {
      setReceipt(await getPaymentReceipt(payment.id, sesion.accessToken))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="card state-card">Cargando...</div>

  if (payment) {
    const proof = payment.proof
    const manualQr = payment.methodDetails?.manualQr
    const confirmed = payment.status === 'paid' && proof?.status === 'approved'

    return (
      <div className="dashboard">
        <div className="page-title"><h2>Estado de tu inscripción</h2></div>
        <section className="card payment-card">
          <div className="payment-summary">
            <div>
              <p className="eyebrow">Pago QR manual</p>
              <h3>{confirmed ? 'Inscripción confirmada' : PAYMENT_LABEL[payment.status] || payment.status}</h3>
              <p className="hint">Total: {formatMoney(payment)}</p>
            </div>
            <span className={`badge-status badge-${proof?.status || payment.status}`}>
              {proof ? PROOF_LABEL[proof.status] || proof.status : PAYMENT_LABEL[payment.status]}
            </span>
          </div>

          {manualQr && !confirmed && (
            <div className="qr-instructions">
              {manualQr.imageUrl && <img src={manualQr.imageUrl} alt="QR de pago de la maratón" className="payment-qr" />}
              <div>
                <h3>Realiza el pago y sube tu comprobante</h3>
                <p>{manualQr.instructions || 'Paga desde tu aplicación bancaria usando este QR.'}</p>
                <p><strong>Referencia:</strong> {manualQr.reference}</p>
              </div>
            </div>
          )}

          {proof?.status === 'rejected' && (
            <div className="notice notice-danger">
              <strong>El comprobante necesita corrección.</strong>
              <p>{proof.note || 'El organizador solicitó un nuevo comprobante.'}</p>
            </div>
          )}

          {!confirmed && payment.status === 'pending' && proof?.status !== 'in_review' && (
            <form className="proof-form" onSubmit={handleUpload}>
              <label>Comprobante de pago<input type="file" name="file" accept="image/*" required onChange={handleChange} /></label>
              <label>Número de transacción (opcional)<input name="reference" value={formData.reference} onChange={handleChange} maxLength={80} /></label>
              {error && <p className="error">{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={uploading}>{uploading ? 'Subiendo...' : 'Enviar comprobante'}</button>
            </form>
          )}

          {proof?.status === 'in_review' && <div className="notice notice-warning">Tu comprobante ya fue enviado. Un organizador lo revisará antes de confirmar la inscripción.</div>}

          {confirmed && (
            <div className="confirmed-actions">
              <p>Tu pago fue verificado y tu inscripción ya está confirmada.</p>
              <button className="btn btn-primary" onClick={handleReceipt}>Mostrar recibo</button>
              {receipt && <a className="receipt-link" href={receipt.url} target="_blank" rel="noreferrer">Abrir recibo PDF</a>}
            </div>
          )}

          {error && !proof?.status && <p className="error">{error}</p>}
        </section>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="page-title"><h2>Panel de corredor/a</h2></div>
      {marathon ? (
        <form className="card" onSubmit={handleSubmit}>
          <h3>Inscripción a: {marathon.name}</h3>
          <label>Nombre completo<input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} /></label>
          <label>Carnet de Identidad (CI)<input type="text" name="docId" required value={formData.docId} onChange={handleChange} /></label>
          <label>Celular<input type="tel" name="phone" required value={formData.phone} onChange={handleChange} /></label>
          <label>Correo electrónico<input type="email" name="email" value={formData.email} disabled /></label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Generando pago...' : 'Inscribirse y generar pago'}</button>
        </form>
      ) : (
        <div className="card state-card"><div className="state-icon">🏁</div><h3>Sin eventos abiertos</h3><p>No hay maratones aceptando inscripciones en este momento.</p></div>
      )}
    </div>
  )
}
