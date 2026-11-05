import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './components/AdminCharts'
import { createManualRegistration, getMarathonCategories } from './api'

const bs = c => `Bs ${((c || 0) / 100).toLocaleString('es-BO', { maximumFractionDigits: 2 })}`
const VACIO = { fullName: '', docId: '', phone: '', email: '', emergencyContactName: '', emergencyContactPhone: '', knowsCam: false, acceptsDonorCall: false }

/**
 * Inscripción en físico: la persona pagó en efectivo al organizador. Queda
 * confirmada al instante con un cobro "Físico" a nombre de quien la carga.
 */
export default function InscripcionFisica({ token, carrera, onCerrar, onListo }) {
  const [f, setF] = useState(VACIO)
  const [cats, setCats] = useState([])
  const [cat, setCat] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [hecho, setHecho] = useState(null)
  const set = k => e => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useEffect(() => {
    getMarathonCategories(carrera.id).then(r => { const l = Array.isArray(r) ? r : r?.items || []; setCats(l); if (l.length === 1) setCat(l[0].id) }, () => {})
  }, [carrera.id])

  useEffect(() => {
    const esc = e => e.key === 'Escape' && !guardando && onCerrar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [guardando])

  async function guardar(e) {
    e.preventDefault()
    if (cats.length && !cat) { setError('Elegí la categoría.'); return }
    setGuardando(true); setError('')
    const personalData = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''))
    try { setHecho(await createManualRegistration(token, carrera.id, { personalData, categoryId: cat || null })) }
    catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  const precio = carrera.priceCents ?? carrera.basePriceCents

  return createPortal(
    <div className="modal-overlay" onClick={() => !guardando && onCerrar()}>
      <form className="modal ad-modal is-wide" role="dialog" aria-modal="true" aria-labelledby="fis-t" onClick={e => e.stopPropagation()} onSubmit={guardar}>
        <div className="modal-header">
          <div><h2 id="fis-t">Inscribir en físico</h2><p className="ad-hint">{carrera.name} · pago en efectivo{precio ? ` · desde ${bs(precio)}` : ''}</p></div>
          <button type="button" className="modal-close" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>

        {hecho ? (
          <>
            <div className="modal-body">
              <p className="ad-ok-note" role="status"><Icon name="check" />{f.fullName} quedó inscrita{hecho.bibNumber ? ` con el dorsal ${hecho.bibNumber}` : ''}. Cobro de {bs(hecho.totalCents)} registrado a tu nombre.</p>
              {hecho.account?.created && <p className="ad-info-note"><Icon name="info" />Se creó su cuenta: entra a la app con usuario y contraseña <b>{hecho.account.username}</b> (su CI) y se le pedirá cambiarla.</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="ad-btn" onClick={() => { setHecho(null); setF(VACIO); setCat(cats.length === 1 ? cats[0].id : '') }}><Icon name="plus" size={16} />Inscribir a otra</button>
              <button type="button" className="ad-btn is-primary" onClick={() => onListo(`${f.fullName} inscrita en físico.`)}>Listo</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-body">
              <p className="ad-info-note"><Icon name="coins" />Usalo solo si recibiste el dinero en mano: la inscripción queda confirmada y el cobro figura como <b>Físico</b>, cobrado por vos.</p>
              <div className="ad-form-grid">
                <label className="ad-field is-span"><span>Nombre completo</span><input required maxLength={160} value={f.fullName} onChange={set('fullName')} autoFocus autoComplete="off" /></label>
                <label className="ad-field"><span>CI</span><input required maxLength={40} value={f.docId} onChange={set('docId')} placeholder="1234567 LP" autoComplete="off" /><small>Con la CI se busca o se crea su cuenta.</small></label>
                <label className="ad-field"><span>Celular</span><input required type="tel" maxLength={40} value={f.phone} onChange={set('phone')} placeholder="70000000" autoComplete="off" /></label>
                <label className="ad-field is-span"><span>Email <small>(opcional)</small></span><input type="email" maxLength={254} value={f.email} onChange={set('email')} placeholder=" " autoComplete="off" /></label>
                <label className="ad-field"><span>Contacto de emergencia <small>(opcional)</small></span><input maxLength={160} value={f.emergencyContactName} onChange={set('emergencyContactName')} autoComplete="off" /></label>
                <label className="ad-field"><span>Celular de emergencia <small>(opcional)</small></span><input type="tel" maxLength={40} value={f.emergencyContactPhone} onChange={set('emergencyContactPhone')} autoComplete="off" /></label>
                {cats.length > 0 && (
                  <label className="ad-field is-span"><span>Categoría</span>
                    <select required value={cat} onChange={e => setCat(e.target.value)}>
                      <option value="">Elegí una categoría</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.name}{c.extraPriceCents > 0 ? ` (+ ${bs(c.extraPriceCents)})` : ''}</option>)}
                    </select>
                  </label>
                )}
                <label className="ad-check is-span"><input type="checkbox" checked={f.knowsCam} onChange={set('knowsCam')} />Conoce el trabajo del CAM</label>
                <label className="ad-check is-span"><input type="checkbox" checked={f.acceptsDonorCall} onChange={set('acceptsDonorCall')} />Acepta que la llamen para ser donadora</label>
              </div>
              {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="ad-btn is-ghost" onClick={onCerrar} disabled={guardando}>Cancelar</button>
              <button className="ad-btn is-ok" disabled={guardando}><Icon name="check" size={16} />{guardando ? 'Inscribiendo…' : 'Cobrar e inscribir'}</button>
            </div>
          </>
        )}
      </form>
    </div>,
    document.body,
  )
}
