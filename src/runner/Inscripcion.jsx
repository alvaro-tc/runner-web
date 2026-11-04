import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../components/AdminCharts'
import {
  checkoutRegistration, createRegistration, forgetCheckout, getMarathon, getPayment, getPaymentProof,
  getRegistration, getRegistrationPayments, listaDe, setRegistrationOptions, uploadPaymentProof,
} from '../api'
import QrPago from './QrPago'
import { bs, faltan, fecha, hora, km } from './util'

const PASOS = [
  { key: 'datos', label: 'Tus datos' },
  { key: 'opciones', label: 'Categoría' },
  { key: 'resumen', label: 'Confirmar' },
  { key: 'pago', label: 'Pago' },
]
const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
const vencido = p => p?.expiresAt && new Date(p.expiresAt) <= new Date()

// Inscripcion de punta a punta. `inscripcion` llega cuando se retoma una ya empezada.
export default function Inscripcion({ carrera, inscripcion: inicial, sesion, onClose, onCambio, onVerRecibo }) {
  const token = sesion.accessToken
  const [detalle, setDetalle] = useState(null)
  const [reg, setReg] = useState(inicial || null)
  const [paso, setPaso] = useState(null) // null = cargando
  const [pago, setPago] = useState(null)
  const [error, setError] = useState('')
  const caja = useRef(null)

  // Arranque: detalle de la carrera y en que paso quedo la inscripcion
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const d = await getMarathon(carrera.slug || carrera.id)
        if (!vivo) return
        setDetalle(d)
        if (!inicial) return setPaso('datos')
        if (inicial.status === 'confirmed') return setPaso('listo')
        if (inicial.status === 'pending_payment') {
          const abierto = listaDe(await getRegistrationPayments(inicial.id, token)).find(p => p.status === 'pending' && !vencido(p))
          if (!vivo) return
          if (abierto) { setPago(abierto); return setPaso('pago') }
          return setPaso('resumen')
        }
        setPaso('datos')
      } catch (e) { if (vivo) { setError(e.message); setPaso('datos') } }
    })()
    return () => { vivo = false }
  }, [carrera.id])

  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onClose])

  useEffect(() => { caja.current?.scrollTo({ top: 0, behavior: 'smooth' }); setError('') }, [paso])

  const tieneOpciones = (detalle?.categories?.length || 0) + (detalle?.extras?.filter(x => x.available).length || 0) > 0
  const pasos = tieneOpciones ? PASOS : PASOS.filter(p => p.key !== 'opciones')
  const indice = pasos.findIndex(p => p.key === paso)

  function cambiar(r) { setReg(r); onCambio?.() }

  return createPortal(
    <div className="rn-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="rn-sheet" role="dialog" aria-modal="true" aria-labelledby="rn-wiz-title" ref={caja}>
        <header className="rn-sheet-hero" style={carrera.coverUrl ? { '--cover': `url("${carrera.coverUrl}")` } : undefined}>
          <button className="rn-close" onClick={onClose} aria-label="Cerrar inscripción"><Icon name="x" /></button>
          <span className="rn-kicker">Inscripción</span>
          <h2 id="rn-wiz-title">{carrera.name}</h2>
          <p><Icon name="calendar" size={15} />{fecha(carrera.startsAt, { weekday: 'short', day: 'numeric', month: 'long' })} · {hora(carrera.startsAt)}
            <Icon name="pin" size={15} />{carrera.city}<Icon name="flag" size={15} />{km(carrera.distanceMeters)}</p>
        </header>

        {paso !== 'listo' && paso && (
          <ol className="rn-stepper" style={{ '--n': pasos.length }} aria-label={`Paso ${indice + 1} de ${pasos.length}`}>
            {pasos.map((p, i) => (
              <li key={p.key} className={i < indice ? 'is-done' : i === indice ? 'is-on' : ''} aria-current={i === indice ? 'step' : undefined}>
                <span className="rn-step-dot">{i < indice ? <Icon name="check" size={14} /> : i + 1}</span>
                <span className="rn-step-label">{p.label}</span>
              </li>
            ))}
            <span className="rn-stepper-bar" style={{ '--prog': Math.max(0, indice) / (pasos.length - 1) }} aria-hidden="true" />
          </ol>
        )}

        <div className="rn-sheet-body" key={paso}>
          {error && <p className="rn-error" role="alert"><Icon name="alert" size={16} />{error}</p>}
          {!paso && <div className="rn-loading"><span className="rn-spin is-lg" /><p>Preparando tu inscripción…</p></div>}
          {paso === 'datos' && (
            <PasoDatos sesion={sesion} previo={reg?.personalData} onError={setError}
              onListo={async datos => {
                const r = await createRegistration(carrera.id, datos, token)
                cambiar(r)
                setPaso(tieneOpciones ? 'opciones' : 'resumen')
              }} />
          )}
          {paso === 'opciones' && (
            <PasoOpciones detalle={detalle} reg={reg} onError={setError} onAtras={() => setPaso('datos')}
              onListo={async (cat, extras) => {
                cambiar(await setRegistrationOptions(reg.id, cat, extras, token))
                setPaso('resumen')
              }} />
          )}
          {paso === 'resumen' && (
            <PasoResumen reg={reg} carrera={carrera} onError={setError} onAtras={() => setPaso(tieneOpciones ? 'opciones' : 'datos')}
              onListo={async () => {
                const { payment, registration } = await checkoutRegistration(reg.id, token, true)
                cambiar(registration)
                setPago(payment)
                setPaso(registration.status === 'confirmed' || payment.status === 'paid' ? 'listo' : 'pago')
              }} />
          )}
          {paso === 'pago' && pago && (
            <PasoPago pago={pago} token={token} onError={setError}
              onPagado={async () => {
                cambiar(await getRegistration(reg.id, token).catch(() => ({ ...reg, status: 'confirmed' })))
                setPaso('listo')
              }}
              onNuevoQr={async () => {
                forgetCheckout(reg.id)
                const { payment, registration } = await checkoutRegistration(reg.id, token, true)
                cambiar(registration); setPago(payment)
              }} />
          )}
          {paso === 'listo' && <PasoListo reg={reg} carrera={carrera} onVerRecibo={() => onVerRecibo(reg)} onClose={onClose} />}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// Envuelve un submit: spinner, y el error sale arriba del paso
function useEnvio(onError) {
  const [enviando, setEnviando] = useState(false)
  return [enviando, async fn => {
    setEnviando(true); onError('')
    try { await fn() } catch (e) { onError(e.message) }
    setEnviando(false)
  }]
}

function Campo({ label, hint, children, full }) {
  return (
    <label className={`rn-field${full ? ' is-full' : ''}`}>
      <span className="rn-field-label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

function SiNo({ legend, value, onChange, name }) {
  return (
    <fieldset className="rn-yesno is-full">
      <legend>{legend}</legend>
      <div>
        {[['Sí', true], ['No', false]].map(([t, v]) => (
          <label key={t} className={value === v ? 'is-on' : ''}>
            <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} required />{t}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function PasoDatos({ sesion, previo, onListo, onError }) {
  const u = sesion.user
  const [f, setF] = useState(() => ({
    fullName: u.name || '', docId: u.ci || '', phone: '', email: u.email || '',
    emergencyContactName: '', emergencyContactPhone: '', bloodType: '', shirtSize: '',
    knowsCam: null, acceptsDonorCall: null, ...(previo || {}),
  }))
  const [enviando, enviar] = useEnvio(onError)
  const set = k => e => setF({ ...f, [k]: e.target.value })

  function submit(e) {
    e.preventDefault()
    if (f.knowsCam === null || f.acceptsDonorCall === null) return onError('Respondé las dos preguntas sobre el CAM.')
    const datos = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''))
    enviar(() => onListo(datos))
  }

  return (
    <form className="rn-form" onSubmit={submit}>
      <h3>¿Quién corre?</h3>
      <p className="rn-muted">Estos datos van en tu dorsal y en la lista oficial de la carrera.</p>
      <div className="rn-grid2">
        <Campo label="Nombre completo" full><input required maxLength={160} value={f.fullName} onChange={set('fullName')} autoComplete="name" /></Campo>
        <Campo label="Carnet de identidad"><input required maxLength={40} value={f.docId} onChange={set('docId')} placeholder="1234567 LP" /></Campo>
        <Campo label="Celular" hint="Por aquí te avisamos cambios de último momento"><input required type="tel" maxLength={40} value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="+591 70000000" /></Campo>
        <Campo label="Correo (opcional)" full><input type="email" maxLength={254} value={f.email} onChange={set('email')} autoComplete="email" /></Campo>
        <Campo label="Talla de polera">
          <select value={f.shirtSize} onChange={set('shirtSize')}><option value="">Elegir</option>{TALLAS.map(t => <option key={t}>{t}</option>)}</select>
        </Campo>
        <Campo label="Tipo de sangre">
          <select value={f.bloodType} onChange={set('bloodType')}><option value="">No sé</option>{SANGRE.map(t => <option key={t}>{t}</option>)}</select>
        </Campo>
      </div>
      <h4 className="rn-subtitle"><Icon name="heart" size={16} />Contacto de emergencia</h4>
      <div className="rn-grid2">
        <Campo label="Nombre"><input maxLength={160} value={f.emergencyContactName} onChange={set('emergencyContactName')} /></Campo>
        <Campo label="Celular"><input type="tel" maxLength={40} value={f.emergencyContactPhone} onChange={set('emergencyContactPhone')} /></Campo>
      </div>
      <div className="rn-grid2">
        <SiNo name="knowsCam" legend="¿Conocés el trabajo del CAM?" value={f.knowsCam} onChange={v => setF({ ...f, knowsCam: v })} />
        <SiNo name="donor" legend="¿Aceptás que te llamemos para ser donador del CAM?" value={f.acceptsDonorCall} onChange={v => setF({ ...f, acceptsDonorCall: v })} />
      </div>
      <div className="rn-actions">
        <span />
        <button className="rn-btn" disabled={enviando}>{enviando ? <span className="rn-spin" /> : null}Continuar<Icon name="arrow" size={18} /></button>
      </div>
    </form>
  )
}

function PasoOpciones({ detalle, reg, onListo, onAtras, onError }) {
  const cats = detalle?.categories || []
  const extras = (detalle?.extras || []).filter(x => x.available)
  const [cat, setCat] = useState(reg?.categoryId || (cats.length === 1 ? cats[0].id : ''))
  const [sel, setSel] = useState(() => Object.fromEntries((Array.isArray(reg?.extras) ? reg.extras : []).map(x => [x.extraId, x.quantity])))
  const [enviando, enviar] = useEnvio(onError)
  const cur = detalle?.currency

  function submit(e) {
    e.preventDefault()
    if (cats.length && !cat) return onError('Elegí una categoría.')
    enviar(() => onListo(cat, Object.entries(sel).filter(([, q]) => q > 0).map(([extraId, quantity]) => ({ extraId, quantity }))))
  }

  return (
    <form className="rn-form" onSubmit={submit}>
      {cats.length > 0 && (<>
        <h3>Elegí tu categoría</h3>
        <div className="rn-choices" role="radiogroup">
          {cats.map((c, i) => (
            <label key={c.id} className={`rn-choice${cat === c.id ? ' is-on' : ''}`} style={{ '--i': i }}>
              <input type="radio" name="cat" checked={cat === c.id} onChange={() => setCat(c.id)} />
              <strong>{c.name}</strong>
              <small>
                {c.minAge != null || c.maxAge != null ? `${c.minAge ?? 0}–${c.maxAge ?? '∞'} años` : 'Todas las edades'}
                {c.gender && ` · ${c.gender === 'female' ? 'Mujeres' : c.gender === 'male' ? 'Varones' : c.gender}`}
              </small>
              {c.extraPriceCents > 0 && <em>+ {bs(c.extraPriceCents, cur)}</em>}
            </label>
          ))}
        </div>
      </>)}
      {extras.length > 0 && (<>
        <h3>Sumá extras</h3>
        <div className="rn-extras">
          {extras.map(x => {
            const q = sel[x.id] || 0
            return (
              <div key={x.id} className={`rn-extra${q ? ' is-on' : ''}`}>
                <div><strong>{x.name}</strong><small>{bs(x.priceCents, cur)}{x.stock != null && ` · quedan ${x.stock}`}</small></div>
                <div className="rn-qty">
                  <button type="button" aria-label={`Quitar ${x.name}`} disabled={!q} onClick={() => setSel({ ...sel, [x.id]: q - 1 })}>−</button>
                  <output aria-live="polite">{q}</output>
                  <button type="button" aria-label={`Agregar ${x.name}`} disabled={x.stock != null && q >= x.stock} onClick={() => setSel({ ...sel, [x.id]: q + 1 })}>+</button>
                </div>
              </div>
            )
          })}
        </div>
      </>)}
      <div className="rn-actions">
        <button type="button" className="rn-btn is-ghost" onClick={onAtras}>Atrás</button>
        <button className="rn-btn" disabled={enviando}>{enviando && <span className="rn-spin" />}Ver resumen<Icon name="arrow" size={18} /></button>
      </div>
    </form>
  )
}

function PasoResumen({ reg, carrera, onListo, onAtras, onError }) {
  const [acepta, setAcepta] = useState(false)
  const [enviando, enviar] = useEnvio(onError)
  const pd = reg?.personalData || {}

  return (
    <form className="rn-form" onSubmit={e => { e.preventDefault(); enviar(onListo) }}>
      <h3>Revisá y confirmá</h3>
      <div className="rn-summary">
        <div className="rn-summary-who">
          <span className="rn-avatar-fallback">{(pd.fullName || '?').slice(0, 1)}</span>
          <div><strong>{pd.fullName}</strong><small>CI {pd.docId} · {pd.phone}{pd.shirtSize && ` · Talla ${pd.shirtSize}`}</small></div>
        </div>
        <ul className="rn-lines">
          {(reg?.items || []).map((l, i) => (
            <li key={i}><span>{l.label}{l.quantity > 1 && ` × ${l.quantity}`}</span><span>{bs(l.amountCents, reg.currency)}</span></li>
          ))}
          {reg?.serviceFee && <li><span>{reg.serviceFee.label}</span><span>{bs(reg.serviceFee.amountCents, reg.currency)}</span></li>}
          <li className="is-total"><span>Total</span><span>{bs(reg?.totalCents, reg?.currency || carrera.currency)}</span></li>
        </ul>
      </div>
      <label className="rn-check">
        <input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)} required />
        <span>Leí y acepto los <a href="/terminos/" target="_blank" rel="noreferrer">Términos y condiciones</a> y declaro estar en condiciones físicas para correr.</span>
      </label>
      <div className="rn-actions">
        <button type="button" className="rn-btn is-ghost" onClick={onAtras}>Atrás</button>
        <button className="rn-btn is-accent" disabled={!acepta || enviando}>{enviando ? <span className="rn-spin" /> : <Icon name="qr" size={18} />}Ir a pagar</button>
      </div>
    </form>
  )
}

function PasoPago({ pago, token, onPagado, onNuevoQr, onError }) {
  const qr = pago.methodDetails?.manualQr || {}
  const auto = !!qr.auto
  const [prueba, setPrueba] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [refBanco, setRefBanco] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [ahora, setAhora] = useState(Date.now())
  const [enviando, enviar] = useEnvio(onError)
  const vista = useMemo(() => archivo && URL.createObjectURL(archivo), [archivo])
  useEffect(() => () => vista && URL.revokeObjectURL(vista), [vista])

  const t = pago.expiresAt ? faltan(pago.expiresAt, ahora) : null
  const expiro = t && t.total === 0

  // Sondeo: la API de pagos o el organizador confirman, aca solo nos enteramos
  useEffect(() => {
    getPaymentProof(pago.id, token).then(setPrueba).catch(() => {})
    const tic = setInterval(() => setAhora(Date.now()), 1000)
    const sondeo = setInterval(async () => {
      try {
        const p = await getPayment(pago.id, token)
        if (p.status === 'paid') { clearInterval(sondeo); return onPagado() }
        if (!auto) setPrueba(await getPaymentProof(pago.id, token))
      } catch {}
    }, auto ? 4000 : 8000)
    return () => { clearInterval(tic); clearInterval(sondeo) }
  }, [pago.id])

  function copiar() {
    navigator.clipboard?.writeText(qr.reference).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1800) })
  }

  const enRevision = prueba?.status === 'in_review'

  return (
    <div className="rn-pay">
      <div className="rn-pay-qr">
        <QrPago payload={qr.payload} imageUrl={qr.imageUrl} logoUrl={qr.logoUrl} nombre={`qr-${qr.reference || 'pago'}`} />
        {t && (
          <p className={`rn-timer${expiro ? ' is-bad' : t.total < 6e5 ? ' is-warn' : ''}`} aria-live="off">
            <Icon name="clock" size={15} />
            {expiro ? 'Este QR venció' : `Vence en ${t.dias ? `${t.dias}d ` : ''}${String(t.horas).padStart(2, '0')}:${String(t.min).padStart(2, '0')}:${String(t.seg).padStart(2, '0')}`}
          </p>
        )}
        {expiro && <button className="rn-btn is-sm" onClick={() => enviar(onNuevoQr)} disabled={enviando}><Icon name="refresh" size={16} />Generar un QR nuevo</button>}
      </div>

      <div className="rn-pay-info">
        <span className="rn-kicker">Monto a pagar</span>
        <p className="rn-amount">{bs(pago.amountCents, pago.currency)}</p>
        {qr.reference && (
          <div className="rn-ref">
            <div><small>{auto ? 'Referencia' : 'Glosa obligatoria'}</small><strong className="rn-mono">{qr.reference}</strong></div>
            <button type="button" className="rn-icon-btn" onClick={copiar} aria-label="Copiar referencia">
              <Icon name={copiado ? 'check' : 'copy'} size={18} />
            </button>
          </div>
        )}
        <ol className="rn-howto">
          <li>Abrí la app de tu banco y escaneá el QR (o guardalo y subilo desde la galería).</li>
          {auto ? <li>Pagá el monto <b>exacto</b>: tu inscripción se confirma sola en segundos.</li>
            : <li>Escribí la glosa <b>{qr.reference}</b> en la transferencia.</li>}
          {!auto && <li>Subí la captura del comprobante aquí abajo.</li>}
        </ol>
        {qr.instructions && <p className="rn-note"><Icon name="info" size={16} />{qr.instructions}</p>}

        {auto ? (
          <div className="rn-waiting"><span className="rn-pulse" />Esperando tu pago…</div>
        ) : enRevision ? (
          <div className="rn-waiting is-ok"><span className="rn-pulse" />Comprobante recibido. Lo estamos revisando; te avisamos al confirmar.</div>
        ) : (
          <form className="rn-proof" onSubmit={e => { e.preventDefault(); enviar(async () => setPrueba(await uploadPaymentProof(pago.id, archivo, refBanco, token))) }}>
            {prueba?.status === 'rejected' && (
              <p className="rn-error" role="alert"><Icon name="alert" size={16} />Rechazamos tu comprobante{prueba.note ? `: ${prueba.note}` : ''}. Subí otro.</p>
            )}
            <label className={`rn-drop${archivo ? ' has-file' : ''}`}>
              <input type="file" accept="image/*" required onChange={e => setArchivo(e.target.files?.[0] || null)} />
              {vista ? <img src={vista} alt="Vista previa del comprobante" /> : (<><Icon name="upload" size={26} /><span>Tocá para subir la captura del comprobante</span></>)}
            </label>
            <Campo label="N.º de transacción (opcional)"><input value={refBanco} onChange={e => setRefBanco(e.target.value)} maxLength={80} /></Campo>
            <button className="rn-btn is-accent" disabled={!archivo || enviando || expiro}>{enviando ? <span className="rn-spin" /> : <Icon name="upload" size={18} />}Enviar comprobante</button>
          </form>
        )}
      </div>
    </div>
  )
}

function PasoListo({ reg, carrera, onVerRecibo, onClose }) {
  const confirmada = reg?.status === 'confirmed'
  return (
    <div className="rn-done">
      <svg className="rn-done-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-15" /></svg>
      <h3>{confirmada ? '¡Estás inscrito!' : 'Pago en revisión'}</h3>
      <p className="rn-muted">
        {confirmada ? `Nos vemos en la largada de ${carrera.name}.` : 'Apenas validemos tu comprobante, tu inscripción queda confirmada y aparece tu dorsal.'}
      </p>
      {confirmada && reg.bibNumber && <div className="rn-done-bib"><span>Tu dorsal</span><strong>{reg.bibNumber}</strong></div>}
      <div className="rn-actions is-center">
        {confirmada && <button className="rn-btn" onClick={onVerRecibo}><Icon name="receipt" size={18} />Ver mi recibo</button>}
        <button className="rn-btn is-ghost" onClick={onClose}>Volver al panel</button>
      </div>
    </div>
  )
}
