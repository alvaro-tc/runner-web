import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import DonationReceipt from './components/DonationReceipt'
import {
  checkoutRegistration,
  createRegistration,
  getMarathonCategories,
  getMarathons,
  getMe,
  getMyRegistrations,
  getRegistrationPayments,
  updateMe,
  uploadPaymentProof,
} from './api'

const REG_LABEL = {
  draft: 'Borrador',
  pending_payment: 'Pago pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
}

const PAYMENT_LABEL = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Rechazado o vencido',
  refunded: 'Reembolsado',
}

const PROOF_LABEL = {
  in_review: 'En revisión',
  rejected: 'Rechazado',
  approved: 'Aprobado',
}

const OPEN = ['open', 'closing_soon']

// El QR va como texto (payload) y lo dibujamos aquí; la imagen subida es solo respaldo
function PaymentQr({ payload, imageUrl }) {
  if (payload) return <QRCodeSVG value={payload} size={180} marginSize={2} className="payment-qr" role="img" aria-label="QR de pago de la maratón" />
  if (imageUrl) return <img src={imageUrl} alt="QR de pago de la maratón" className="payment-qr" />
  return null
}

const money = (cents, currency) => `${(cents / 100).toFixed(2)} ${currency}`
const date = (iso) => (iso ? new Date(iso).toLocaleDateString('es-BO', { dateStyle: 'long' }) : '—')

export default function RunnerDashboard({ sesion }) {
  const token = sesion.accessToken
  const [tab, setTab] = useState('maratones')
  const [me, setMe] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMe(token).then(setMe).catch((err) => setError(err.message))
  }, [token])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>Panel de corredora</h1>
          <p>Centro de Apoyo a la Mujer · Maratón de la Mujer</p>
        </div>
      </div>

      <div className="dashboard-body container">
        <div className="dash-tabs">
          {[
            ['maratones', 'Maratones'],
            ['inscripciones', 'Mis inscripciones'],
            ['perfil', 'Mis datos'],
          ].map(([key, label]) => (
            <button key={key} className={`dash-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {error && <p className="dash-error">{error}</p>}
        {!me && !error && <div className="dash-loading">Cargando…</div>}

        {me && tab === 'perfil' && <Profile me={me} token={token} onSaved={setMe} />}
        {me && tab === 'maratones' && <Marathons me={me} token={token} onRegistered={() => setTab('inscripciones')} />}
        {me && tab === 'inscripciones' && <Registrations me={me} token={token} />}
      </div>
    </div>
  )
}

function Profile({ me, token, onSaved }) {
  const [form, setForm] = useState({
    name: me.name || '',
    email: me.email || '',
    ci: me.ci || '',
    phone: me.profile?.phone || '',
    city: me.profile?.city || '',
  })
  const [estado, setEstado] = useState({})

  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setEstado({ saving: true })
    try {
      const data = { name: form.name, phone: form.phone || null, city: form.city || null }
      // email y ci no aceptan null: solo se mandan si tienen valor
      if (form.email) data.email = form.email
      if (form.ci) data.ci = form.ci
      onSaved(await updateMe(data, token))
      setEstado({ ok: true })
    } catch (err) {
      setEstado({ error: err.message })
    }
  }

  return (
    <div className="dash-card">
      <div className="dash-card-header"><h2>Mis datos</h2></div>
      <form className="dash-form" onSubmit={submit}>
        <div className="dash-form-grid">
          <label>Nombre completo<input name="name" required maxLength={120} value={form.name} onChange={change} /></label>
          <label>Correo electrónico<input type="email" name="email" maxLength={254} value={form.email} onChange={change} /></label>
          <label>Carnet de Identidad (CI)<input name="ci" maxLength={40} value={form.ci} onChange={change} /></label>
          <label>Celular<input type="tel" name="phone" maxLength={40} value={form.phone} onChange={change} /></label>
          <label>Ciudad<input name="city" maxLength={80} value={form.city} onChange={change} /></label>
        </div>
        {estado.error && <p className="dash-error">{estado.error}</p>}
        {estado.ok && <p className="notice notice-success">Datos actualizados.</p>}
        <button className="btn-primary" type="submit" disabled={estado.saving}>{estado.saving ? 'Guardando…' : 'Guardar cambios'}</button>
      </form>
    </div>
  )
}

function Marathons({ me, token, onRegistered }) {
  const [marathons, setMarathons] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMarathons().then(setMarathons).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="dash-error">{error}</p>
  if (!marathons) return <div className="dash-loading">Cargando…</div>

  if (selected) {
    return <RegistrationForm marathon={selected} me={me} token={token} onCancel={() => setSelected(null)} onDone={onRegistered} />
  }

  if (marathons.length === 0) {
    return <div className="dash-card"><div className="dash-empty"><span>🏁</span><p>No hay maratones publicadas en este momento.</p></div></div>
  }

  return (
    <div className="dash-card">
      <div className="dash-card-header"><h2>Maratones</h2></div>
      <div className="table-wrap">
        <table className="dash-table">
          <thead><tr><th>Maratón</th><th>Fecha</th><th>Ciudad</th><th>Distancia</th><th>Precio</th><th>Cupos</th><th></th></tr></thead>
          <tbody>
            {marathons.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.name}</strong></td>
                <td>{date(m.startsAt)}</td>
                <td>{m.city}</td>
                <td>{(m.distanceMeters / 1000).toFixed(1)} km</td>
                <td>{money(m.priceCents, m.currency)}</td>
                <td>{m.slotsAvailable}</td>
                <td>
                  {OPEN.includes(m.registrationStatus)
                    ? <button className="btn-primary-sm" onClick={() => setSelected(m)}>Inscribirme</button>
                    : <span className="status-badge badge-cancelled">Inscripciones cerradas</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RegistrationForm({ marathon, me, token, onCancel, onDone }) {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    fullName: me.name || '',
    docId: me.ci || '',
    phone: me.profile?.phone || '',
    email: me.email || '',
    categoryId: '',
    knowsCam: false,
    acceptsDonorCall: false,
  })
  const [estado, setEstado] = useState({})
  const [preview, setPreview] = useState(null)

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  useEffect(() => {
    getMarathonCategories(marathon.id).then((cats) => {
      setCategories(cats)
      if (cats.length) setForm((prev) => ({ ...prev, categoryId: cats[0].id }))
    }).catch(() => {})
  }, [marathon.id])

  function change(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function submit(e) {
    e.preventDefault()
    const proof = new FormData(e.target)
    setEstado({ saving: true })
    const { categoryId, ...personal } = form
    // Los opcionales vacíos no se mandan: el backend valida formato si vienen
    const personalData = Object.fromEntries(
      Object.entries(personal).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]).filter(([, v]) => v !== ''),
    )
    try {
      const reg = await createRegistration(marathon.id, personalData, token, categoryId || undefined)
      const { payment } = await checkoutRegistration(reg.id, token)
      await uploadPaymentProof(payment.id, proof.get('file'), proof.get('reference'), token)
      onDone()
    } catch (err) {
      // ponytail: si falla tras crear la inscripción, el corredor reintenta el comprobante desde "Mis inscripciones"
      setEstado({ error: err.message })
    }
  }

  // Sin payload el backend rechaza el checkout (QR_NOT_CONFIGURED) después de crear la inscripción
  const hasQr = Boolean(marathon.paymentQrPayload?.trim())
  const total = marathon.priceCents + (categories.find((c) => c.id === form.categoryId)?.extraPriceCents || 0)

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <h2>Inscripción: {marathon.name}</h2>
        <button className="btn-ghost-sm" onClick={onCancel}>Volver</button>
      </div>
      <p className="dash-desc">{date(marathon.startsAt)} · {marathon.city} · {money(marathon.priceCents, marathon.currency)}</p>
      <form className="dash-form" onSubmit={submit}>
        <h3 className="form-section">1. Datos personales</h3>
        <div className="dash-form-grid">
          <label>Nombre completo *
            <input name="fullName" required minLength={3} maxLength={160} autoComplete="name" placeholder="Ej. María Pérez Rojas" value={form.fullName} onChange={change} />
          </label>
          <label>Carnet de Identidad (CI) *
            <input name="docId" required maxLength={40} placeholder="Ej. 1234567 LP" value={form.docId} onChange={change} />
          </label>
          <label>Celular *
            <input type="tel" name="phone" required inputMode="tel" autoComplete="tel" pattern="[+\d\s-]{7,20}" title="Solo números, espacios, + o -" placeholder="Ej. 71234567" maxLength={40} value={form.phone} onChange={change} />
          </label>
          <label>Correo electrónico
            <input type="email" name="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" maxLength={254} value={form.email} onChange={change} />
          </label>
          {categories.length > 0 && (
            <label>Categoría *
              <select name="categoryId" required value={form.categoryId} onChange={change}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.extraPriceCents ? ` (+${money(c.extraPriceCents, marathon.currency)})` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label className="dash-check"><input type="checkbox" name="knowsCam" checked={form.knowsCam} onChange={change} /> ¿Conoce usted el trabajo del CAM?</label>
        <label className="dash-check"><input type="checkbox" name="acceptsDonorCall" checked={form.acceptsDonorCall} onChange={change} /> Acepto que me llamen para la oportunidad de ser donador/a del CAM</label>

        <h3 className="form-section">2. Pago por QR</h3>
        {!hasQr && <p className="notice notice-warning">Esta maratón todavía no tiene un QR de pago cargado. Vuelve a intentarlo más tarde.</p>}
        <div className="qr-instructions">
          <PaymentQr payload={marathon.paymentQrPayload} imageUrl={marathon.paymentQrUrl} />
          <div>
            <p>{marathon.paymentQrInstructions || 'Escanea el QR desde tu aplicación bancaria y paga el monto indicado.'}</p>
            <p><strong>Monto a pagar:</strong> {money(total, marathon.currency)}</p>
          </div>
        </div>
        <div className="dash-form-grid">
          <label>Comprobante de pago *
            <input type="file" name="file" accept="image/*" required onChange={(e) => setPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null)} />
          </label>
          <label>Número de transacción
            <input name="reference" maxLength={80} placeholder="Opcional" />
          </label>
        </div>
        {preview && <img src={preview} alt="Vista previa del comprobante" className="proof-preview" />}

        {estado.error && <p className="dash-error">{estado.error}</p>}
        <button className="btn-primary dash-submit" type="submit" disabled={estado.saving || !hasQr}>{estado.saving ? 'Enviando…' : 'Enviar inscripción y comprobante'}</button>
      </form>
    </div>
  )
}

function Registrations({ me, token }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  async function load() {
    setError(null)
    try {
      const regs = await getMyRegistrations(token)
      const payments = await Promise.all(regs.map((r) => getRegistrationPayments(r.id, token).catch(() => [])))
      setItems(regs.map((r, i) => ({ ...r, payments: payments[i] })))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="dash-error">{error}</p>
  if (!items) return <div className="dash-loading">Cargando…</div>
  if (items.length === 0) {
    return <div className="dash-card"><div className="dash-empty"><span>📋</span><p>Todavía no tienes inscripciones.</p></div></div>
  }

  return (
    <>
      <button className="btn-outline-sm" onClick={load} style={{ marginBottom: '1rem' }}>Actualizar</button>
      {items.map((reg) => <RegistrationCard key={reg.id} reg={reg} me={me} token={token} onChange={load} />)}
    </>
  )
}

function RegistrationCard({ reg, me, token, onChange }) {
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  // Del más nuevo al más viejo: el primero es el cobro vigente
  const current = reg.payments[0]
  const canPay = ['draft', 'pending_payment'].includes(reg.status) && current?.status !== 'pending'

  async function run(fn) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      onChange()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function upload(e) {
    e.preventDefault()
    const data = new FormData(e.target)
    run(() => uploadPaymentProof(current.id, data.get('file'), data.get('reference'), token))
  }

  const qr = current?.methodDetails?.manualQr

  const [receiptData, setReceiptData] = useState(null)
  const openReceipt = (p) => setReceiptData({
    receiptNumber: String(p.id).slice(-8).toUpperCase(),
    paymentId: p.id,
    donor: reg.fullName || me.name,
    concept: reg.marathon.name,
    amountCents: p.amountCents,
    currencySymbol: 'Bs',
    date: p.paidAt || p.proof?.createdAt,
  })

  return (
    <div className="dash-card reg-card">
      <div className="dash-card-header">
        <h2>{reg.marathon.name}</h2>
        <span className={`status-badge badge-${reg.status}`}>{REG_LABEL[reg.status] || reg.status}</span>
      </div>

      <div className="reg-facts">
        <div><span>Fecha</span><strong>{date(reg.marathon.startsAt)}</strong></div>
        <div><span>Ciudad</span><strong>{reg.marathon.city || '—'}</strong></div>
        <div><span>Dorsal</span><strong>{reg.bibNumber || 'Por asignar'}</strong></div>
        <div><span>Total</span><strong>{money(reg.totalCents, reg.currency)}</strong></div>
      </div>

      <div className="dash-form payment-card">
        {current?.status === 'pending' && qr && current.proof?.status !== 'in_review' && (
          <>
            <div className="qr-instructions">
              <PaymentQr payload={qr.payload} imageUrl={qr.imageUrl} />
              <div>
                <h3>Realiza el pago y sube tu comprobante</h3>
                <p>{qr.instructions || 'Paga desde tu aplicación bancaria usando este QR.'}</p>
                <p><strong>Referencia:</strong> {qr.reference}</p>
                <p><strong>Monto:</strong> {money(current.amountCents, current.currency)}</p>
              </div>
            </div>
            {current.proof?.status === 'rejected' && (
              <div className="notice notice-danger">
                <strong>El comprobante necesita corrección.</strong>
                <p>{current.proof.note || 'El organizador solicitó un nuevo comprobante.'}</p>
              </div>
            )}
            <form className="proof-form" onSubmit={upload}>
              <label>Comprobante de pago<input type="file" name="file" accept="image/*" required /></label>
              <label>Número de transacción (opcional)<input name="reference" maxLength={80} /></label>
              <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Subiendo…' : 'Enviar comprobante'}</button>
            </form>
          </>
        )}

        {reg.status === 'confirmed' && (
          <div className="notice notice-success">¡Tu inscripción está confirmada! Nos vemos en la línea de partida.</div>
        )}

        {current?.proof?.status === 'in_review' && (
          <div className="notice notice-warning">Tu comprobante ya fue enviado. Un organizador lo revisará antes de confirmar la inscripción.</div>
        )}

        {canPay && (
          <button className="btn-primary" disabled={busy} onClick={() => run(() => checkoutRegistration(reg.id, token))}>
            {busy ? 'Generando pago…' : 'Generar pago'}
          </button>
        )}

        {error && <p className="dash-error">{error}</p>}

        {reg.payments.length > 0 && (
          <div className="pay-list">
            <h3>Historial de pagos</h3>
            {reg.payments.map((p) => (
              <div className="pay-row" key={p.id}>
                <div>
                  <strong>{money(p.amountCents, p.currency)}</strong>
                  <div className="cell-sub">{date(p.proof?.createdAt || p.paidAt || p.expiresAt)}{p.proof?.reference ? ` · Ref. ${p.proof.reference}` : ''}</div>
                  {p.proof?.note && <div className="cell-sub">{p.proof.note}</div>}
                </div>
                <div className="pay-row-badges">
                  <span className={`status-badge badge-${p.status}`}>{PAYMENT_LABEL[p.status] || p.status}</span>
                  {p.proof && <span className={`status-badge badge-${p.proof.status}`}>Comprobante: {PROOF_LABEL[p.proof.status] || p.proof.status}</span>}
                </div>
                <div className="pay-row-actions">
                  {p.proof && <a className="btn-outline-sm" href={p.proof.imageUrl} target="_blank" rel="noreferrer">Ver comprobante</a>}
                  {p.status === 'paid' && <button className="btn-primary-sm" onClick={() => openReceipt(p)}>Recibo</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {receiptData && <DonationReceipt data={receiptData} onClose={() => setReceiptData(null)} />}
    </div>
  )
}
