import { useEffect, useState } from 'react'
import DonationReceipt from './components/DonationReceipt'
import {
  getAdminMarathons,
  getAdminMarathon,
  getMarathonStats,
  getAdminRegistrations,
  createMarathon,
  updateMarathon,
  deleteMarathon,
  publishMarathon,
  unpublishMarathon,
  setRegistrationsOpen,
  uploadMarathonQR,
  uploadMarathonImage,
  createRehearsal,
  resetMarathonLive,
  downloadRegistrantsCsv,
} from './api'

// Las imagenes de una carrera: el campo del detalle y el tramo del endpoint.
// La app elige sola cual pinta segun la forma del hueco.
const IMAGENES = [
  { campo: 'logoVerticalUrl', slot: 'logo/vertical', titulo: 'Logo vertical', ayuda: 'Afiche grande del inicio de la app. PNG con fondo transparente.', ratio: '4 / 5' },
  { campo: 'logoHorizontalUrl', slot: 'logo/horizontal', titulo: 'Logo horizontal', ayuda: 'Tarjetas y cabeceras. PNG con fondo transparente.', ratio: '16 / 10' },
  { campo: 'coverUrl', slot: 'cover', titulo: 'Afiche o foto', ayuda: 'Se usa si falta algún logo. Nunca se recorta.', ratio: '16 / 9' },
]

const SECCIONES = [
  ['datos', 'Datos generales'],
  ['inscripcion', 'Inscripción'],
  ['incluye', 'Qué incluye'],
  ['cronograma', 'Cronograma'],
  ['kit', 'Retiro de kit'],
  ['imagenes', 'Imágenes'],
  ['cobro', 'Cobro por QR'],
  ['delicado', 'Acciones delicadas'],
]

const ESTADO_INSCRIPCION = { open: 'Abiertas', closing_soon: 'Por cerrar', full: 'Cupos llenos', closed: 'Cerradas' }

const bs = cents => `Bs ${((cents || 0) / 100).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const num = n => (n ?? 0).toLocaleString('es-BO')

// datetime-local trabaja en hora del navegador; toISOString() daria UTC
function aLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
}

function formDesde(m) {
  const laps = m.laps || 1
  const kit = m.kitPickup || {}
  return {
    name: m.name || '',
    slug: m.slug || '',
    city: m.city || '',
    startsAt: aLocal(m.startsAt),
    distanceMeters: m.distanceMeters ? String(Math.round(m.distanceMeters / laps)) : '',
    laps: String(laps),
    capacity: String(m.capacity ?? ''),
    price: ((m.priceCents || 0) / 100).toFixed(2),
    description: m.description || '',
    registrationClosesAt: aLocal(m.registrationClosesAt),
    includes: (Array.isArray(m.includes) ? m.includes : []).join('\n'),
    schedule: Array.isArray(m.schedule) ? m.schedule.map(s => ({ time: s.time || '', title: s.title || '', description: s.description || '' })) : [],
    kitAddress: kit.address || '',
    kitFrom: aLocal(kit.from),
    kitTo: aLocal(kit.to),
    paymentQrInstructions: m.paymentQrInstructions || '',
  }
}

function leerGuardada() {
  try { return localStorage.getItem('admin.carrera') || '' } catch { return '' }
}

export default function PanelCarreras({ sesion }) {
  const token = sesion.accessToken
  const [carreras, setCarreras] = useState([])
  const [selId, setSelId] = useState(leerGuardada)
  const [tab, setTab] = useState('resumen')
  const [detalle, setDetalle] = useState(null)
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [nueva, setNueva] = useState(false)

  const sel = carreras.find(c => c.id === selId)

  async function cargarCarreras() {
    try {
      const lista = await getAdminMarathons(token)
      setCarreras(lista)
      if (!lista.some(c => c.id === selId)) setSelId(lista.find(c => !c.rehearsalOfId)?.id || lista[0]?.id || '')
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  async function cargarCarrera(id = selId) {
    if (!id) return
    setStatsError('')
    getMarathonStats(token, id).then(setStats, e => { setStats(null); setStatsError(e.message) })
    try { setDetalle(await getAdminMarathon(token, id)) }
    catch (e) { setError(e.message) }
  }

  useEffect(() => { cargarCarreras() }, [])

  useEffect(() => {
    if (!selId) return
    try { localStorage.setItem('admin.carrera', selId) } catch {}
    setDetalle(null); setStats(null)
    cargarCarrera(selId)
  }, [selId])

  async function refrescar() {
    await Promise.all([cargarCarreras(), cargarCarrera()])
  }

  if (cargando) return <div className="dashboard"><div className="dash-loading pc-top">Cargando carreras…</div></div>

  const dias = sel ? Math.ceil((new Date(sel.startsAt) - Date.now()) / 864e5) : 0

  return (
    <div className="dashboard pc">
      <header className="pc-band">
        <div className="container pc-band-in">
          <label className="pc-picker">
            <span>Carrera</span>
            <select value={selId} onChange={e => setSelId(e.target.value)} aria-label="Elegir carrera">
              {carreras.length === 0 && <option value="">Todavía no hay carreras</option>}
              {carreras.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.rehearsalOfId ? ' (ensayo)' : ''}</option>
              ))}
            </select>
          </label>
          {sel && (
            <p className="pc-meta">
              <span className={`pc-chip ${sel.published ? 'is-on' : ''}`}>{sel.published ? 'Publicada' : 'Borrador'}</span>
              {sel.city}, {new Date(sel.startsAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}
              {dias > 0 ? `, faltan ${dias} días` : dias === 0 ? ', es hoy' : ', ya se corrió'}
            </p>
          )}
          <button className="pc-new" onClick={() => setNueva(true)}>Nueva carrera</button>
        </div>
      </header>

      <div className="container dashboard-body">
        {error && <p className="dash-error" role="alert">{error} <button className="pc-link" onClick={() => setError('')}>Cerrar</button></p>}

        {!sel ? (
          <div className="dash-card dash-empty-state">
            <h2>Creá la primera carrera</h2>
            <p>Con la carrera creada vas a ver sus inscritas, lo recaudado y las visitas.</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setNueva(true)}>Nueva carrera</button>
          </div>
        ) : (
          <>
            <nav className="dash-tabs" aria-label="Secciones de la carrera">
              {[['resumen', 'Resumen'], ['editar', 'Editar carrera'], ['inscritas', 'Inscritas']].map(([k, l]) => (
                <button key={k} className={`dash-tab${tab === k ? ' active' : ''}`} aria-current={tab === k} onClick={() => setTab(k)}>{l}</button>
              ))}
            </nav>

            {tab === 'resumen' && <Resumen carrera={sel} stats={stats} statsError={statsError} />}
            {tab === 'editar' && (detalle
              ? <EditorCarrera key={detalle.id} token={token} carrera={detalle} onCambio={setDetalle} onGuardado={refrescar}
                  onEliminada={() => { setSelId(''); cargarCarreras(); setTab('resumen') }} onError={setError} />
              : <div className="dash-loading">Cargando carrera…</div>)}
            {tab === 'inscritas' && <Inscritas key={sel.id} token={token} carrera={sel} />}
          </>
        )}
      </div>

      {nueva && (
        <NuevaCarrera token={token} onCerrar={() => setNueva(false)} onCreada={async m => {
          setNueva(false)
          await cargarCarreras()
          setSelId(m.id)
          setTab('editar')
        }} />
      )}
    </div>
  )
}

function Resumen({ carrera, stats, statsError }) {
  const inscritas = stats?.confirmed ?? carrera.slotsTaken
  const cupos = stats?.capacity ?? carrera.capacity
  const pct = cupos ? Math.min(100, (inscritas / cupos) * 100) : 0
  const conversion = stats?.marathonViews ? (inscritas / stats.marathonViews) * 100 : null

  return (
    <div className="pc-resumen">
      <section className="pc-lane" aria-label="Cupos ocupados">
        <div className="pc-lane-head">
          <p className="pc-big"><strong>{num(inscritas)}</strong> inscritas de {num(cupos)} cupos</p>
          <p className="pc-lane-side">{num(Math.max(0, cupos - inscritas))} cupos libres</p>
        </div>
        <div className="pc-track" role="progressbar" aria-valuemin={0} aria-valuemax={cupos} aria-valuenow={inscritas}>
          <div className="pc-track-fill" style={{ width: `${pct}%` }} />
          <div className="pc-track-runner" style={{ left: `${pct}%` }} />
          <div className="pc-track-finish" />
        </div>
        <p className="pc-lane-foot">{pct.toFixed(0)}% de la carrera ocupada</p>
      </section>

      {statsError && <p className="dash-error">No se pudieron cargar las métricas: {statsError}</p>}

      <div className="pc-groups">
        <section className="pc-group">
          <h3>Dinero</h3>
          <Kpi label="Total recaudado" value={stats ? bs(stats.revenueCents) : '…'} nota="Suma de cobros validados" fuerte />
          <Kpi label="Cobros validados" value={stats ? num(stats.paymentsPaid) : '…'} />
          <Kpi label="Cobros por validar" value={stats ? num(stats.paymentsPending) : '…'}
            nota={stats ? `${num(stats.proofsInReview)} con comprobante esperando revisión` : ' '} alerta={stats?.paymentsPending > 0} />
        </section>
        <section className="pc-group">
          <h3>Alcance</h3>
          <Kpi label="Visitas a la página" value={stats ? num(stats.pageViews) : '…'} nota="Aperturas de la página de inicio" />
          <Kpi label="Vistas de la carrera" value={stats ? num(stats.marathonViews) : '…'} nota="Aperturas del detalle, web y app" />
          <Kpi label="Conversión" value={conversion === null ? '—' : `${conversion.toFixed(1)}%`} nota="Inscritas por cada vista de la carrera" />
        </section>
      </div>
    </div>
  )
}

function Kpi({ label, value, nota, fuerte, alerta }) {
  const cargando = value === '…'
  return (
    <div className={`pc-kpi${fuerte ? ' is-strong' : ''}${alerta ? ' is-alert' : ''}`} aria-busy={cargando}>
      <span className="pc-kpi-label">{label}</span>
      {cargando ? <span className="pc-skel" aria-label="Cargando" /> : <span className="pc-kpi-value">{value}</span>}
      {nota && <span className="pc-kpi-note">{nota}</span>}
    </div>
  )
}

function EditorCarrera({ token, carrera, onCambio, onGuardado, onEliminada, onError }) {
  const [f, setF] = useState(() => formDesde(carrera))
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [subiendo, setSubiendo] = useState('')
  const [qrFile, setQrFile] = useState(null)

  // El aviso flota abajo: las acciones del final de la hoja quedan lejos de la barra de guardado
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  const set = (campo, valor) => setF(prev => ({ ...prev, [campo]: valor }))
  const campo = e => set(e.target.name, e.target.value)
  const setFila = (i, k, v) => set('schedule', f.schedule.map((s, j) => j === i ? { ...s, [k]: v } : s))

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true); setAviso('')
    try {
      const kit = f.kitAddress.trim()
        ? { address: f.kitAddress.trim(), ...(f.kitFrom && { from: new Date(f.kitFrom).toISOString() }), ...(f.kitTo && { to: new Date(f.kitTo).toISOString() }) }
        : null
      const m = await updateMarathon(token, carrera.id, {
        name: f.name,
        slug: f.slug || undefined,
        city: f.city,
        startsAt: new Date(f.startsAt).toISOString(),
        distanceMeters: parseInt(f.distanceMeters, 10),
        laps: parseInt(f.laps, 10) || 1,
        capacity: parseInt(f.capacity, 10),
        priceCents: Math.round(parseFloat(f.price) * 100),
        description: f.description.trim() || null,
        registrationClosesAt: f.registrationClosesAt ? new Date(f.registrationClosesAt).toISOString() : null,
        includes: f.includes.split('\n').map(s => s.trim()).filter(Boolean),
        schedule: f.schedule.filter(s => s.time || s.title).map(s => ({ time: s.time, title: s.title, ...(s.description && { description: s.description }) })),
        kitPickup: kit,
        paymentQrInstructions: f.paymentQrInstructions.trim() || null,
      })
      if (m) onCambio(m)
      setAviso('Cambios guardados')
      onGuardado()
    } catch (err) { setAviso(''); onError(err.message) }
    finally { setGuardando(false) }
  }

  async function accion(fn, okMsg) {
    try { await fn(); setAviso(okMsg); onGuardado() }
    catch (err) { onError(err.message) }
  }

  async function subirImagen(img, file) {
    if (!file) return
    setSubiendo(img.campo)
    try { onCambio(await uploadMarathonImage(token, carrera.id, img.slot, file)) }
    catch (err) { onError(err.message) }
    finally { setSubiendo('') }
  }

  async function quitarImagen(img) {
    if (!window.confirm(`¿Quitar ${img.titulo.toLowerCase()}?`)) return
    setSubiendo(img.campo)
    try { onCambio(await updateMarathon(token, carrera.id, { [img.campo]: null })) }
    catch (err) { onError(err.message) }
    finally { setSubiendo('') }
  }

  async function subirQr() {
    if (!qrFile) return
    setSubiendo('qr')
    try { await uploadMarathonQR(token, carrera.id, qrFile); setQrFile(null); setAviso('QR de cobro actualizado'); onGuardado() }
    catch (err) { onError(err.message) }
    finally { setSubiendo('') }
  }

  function ensayo() {
    const texto = window.prompt(
      `Ensayo de "${carrera.name}"\n\nSe crea una copia privada con las cuentas que pongas como inscritas de prueba. ` +
      'La carrera real no se toca.\n\nEmails de las cuentas de prueba (separados por coma):'
    )
    if (!texto) return
    const emails = texto.split(/[\s,;]+/).filter(e => e.includes('@'))
    if (emails.length === 0) { onError('Escribí al menos un email para el ensayo'); return }
    accion(() => createRehearsal(token, carrera.id, emails), 'Ensayo creado. Elegilo en el selector de carrera.')
  }

  function reiniciar() {
    const detalle = carrera.rehearsalOfId
      ? 'Vuelve a quedar sin preparar ni largar y se borra lo que corrieron las inscritas de prueba.'
      : 'Vuelve a quedar sin preparar ni largar y los móviles de sus inscritas se liberan. Lo ya corrido no se borra.'
    if (window.confirm(`¿Reiniciar "${carrera.name}"?\n\n${detalle}`)) accion(() => resetMarathonLive(token, carrera.id), 'Carrera reiniciada')
  }

  async function eliminar() {
    if (window.prompt(`Para eliminar "${carrera.name}" escribí su nombre exacto:`) !== carrera.name) return
    try { await deleteMarathon(token, carrera.id); onEliminada() }
    catch (err) { onError(err.message) }
  }

  const cerradas = carrera.registrationStatus === 'closed'
  const enVivo = carrera.preparingAt || carrera.liveStartedAt || carrera.liveFinishedAt

  return (
    <div className="pc-editor">
      <p className={`pc-toast${aviso ? ' is-on' : ''}`} role="status" aria-live="polite">{aviso}</p>
      <nav className="pc-index" aria-label="Partes de la carrera">
        {SECCIONES.map(([id, t]) => <a key={id} href={`#pc-${id}`}>{t}</a>)}
      </nav>

      <div className="pc-sheets">
        <form onSubmit={guardar} className="pc-form">
          <fieldset id="pc-datos" className="pc-sheet">
            <legend>Datos generales</legend>
            <div className="pc-grid">
              <label className="form-label pc-span">Nombre<input className="form-input" name="name" required value={f.name} onChange={campo} /></label>
              <label className="form-label">Dirección web<input className="form-input" name="slug" value={f.slug} onChange={campo} pattern="[a-z0-9-]+" title="Minúsculas, números y guiones" /></label>
              <label className="form-label">Ciudad<input className="form-input" name="city" required value={f.city} onChange={campo} /></label>
              <label className="form-label">Largada<input className="form-input" type="datetime-local" name="startsAt" required value={f.startsAt} onChange={campo} /></label>
              <label className="form-label">Precio (Bs)<input className="form-input" type="number" min="0" step="0.01" name="price" required value={f.price} onChange={campo} /></label>
              <label className="form-label">Distancia de una vuelta (m)<input className="form-input" type="number" min="1" name="distanceMeters" required value={f.distanceMeters} onChange={campo} /></label>
              <label className="form-label">Vueltas<input className="form-input" type="number" min="1" name="laps" required value={f.laps} onChange={campo} /></label>
              <label className="form-label pc-span">Descripción<textarea className="form-input" rows="4" name="description" maxLength={4000} value={f.description} onChange={campo} /></label>
            </div>
          </fieldset>

          <fieldset id="pc-inscripcion" className="pc-sheet">
            <legend>Inscripción</legend>
            <div className="pc-grid">
              <label className="form-label">Cupos<input className="form-input" type="number" min="1" name="capacity" required value={f.capacity} onChange={campo} /></label>
              <label className="form-label">Cierre automático<input className="form-input" type="datetime-local" name="registrationClosesAt" value={f.registrationClosesAt} onChange={campo} /></label>
            </div>
            <div className="pc-row">
              <span>Estado actual: <strong>{ESTADO_INSCRIPCION[carrera.registrationStatus] || carrera.registrationStatus}</strong></span>
              <button type="button" className="btn-outline-sm" onClick={() => accion(() => setRegistrationsOpen(token, carrera.id, cerradas), cerradas ? 'Inscripciones abiertas' : 'Inscripciones cerradas')}>
                {cerradas ? 'Abrir inscripciones' : 'Cerrar inscripciones'}
              </button>
            </div>
          </fieldset>

          <fieldset id="pc-incluye" className="pc-sheet">
            <legend>Qué incluye</legend>
            <label className="form-label">Una cosa por línea<textarea className="form-input" rows="4" name="includes" value={f.includes} onChange={campo} placeholder={'Polera\nMedalla\nHidratación'} /></label>
          </fieldset>

          <fieldset id="pc-cronograma" className="pc-sheet">
            <legend>Cronograma</legend>
            {f.schedule.length === 0 && <p className="pc-hint">Sin horarios cargados. Agregá la acreditación, la largada y la premiación.</p>}
            {f.schedule.map((s, i) => (
              <div key={i} className="pc-sched">
                <input className="form-input" type="time" aria-label="Hora" value={s.time} onChange={e => setFila(i, 'time', e.target.value)} />
                <input className="form-input" aria-label="Qué pasa" placeholder="Largada" value={s.title} onChange={e => setFila(i, 'title', e.target.value)} />
                <input className="form-input" aria-label="Detalle" placeholder="Detalle (opcional)" value={s.description} onChange={e => setFila(i, 'description', e.target.value)} />
                <button type="button" className="btn-danger-sm" aria-label="Quitar horario" onClick={() => set('schedule', f.schedule.filter((_, j) => j !== i))}>Quitar</button>
              </div>
            ))}
            <button type="button" className="btn-outline-sm" onClick={() => set('schedule', [...f.schedule, { time: '', title: '', description: '' }])}>Agregar horario</button>
          </fieldset>

          <fieldset id="pc-kit" className="pc-sheet">
            <legend>Retiro de kit</legend>
            <div className="pc-grid">
              <label className="form-label pc-span">Dirección<input className="form-input" name="kitAddress" value={f.kitAddress} onChange={campo} placeholder="Vacío si no hay retiro de kit" /></label>
              <label className="form-label">Desde<input className="form-input" type="datetime-local" name="kitFrom" value={f.kitFrom} onChange={campo} /></label>
              <label className="form-label">Hasta<input className="form-input" type="datetime-local" name="kitTo" value={f.kitTo} onChange={campo} /></label>
            </div>
          </fieldset>

          <fieldset id="pc-cobro-texto" className="pc-sheet pc-sheet-flat">
            <label className="form-label">Instrucciones del cobro por QR<textarea className="form-input" rows="2" maxLength={500} name="paymentQrInstructions" value={f.paymentQrInstructions} onChange={campo} placeholder="Ej.: poné tu CI en la glosa" /></label>
          </fieldset>

          <div className="pc-savebar">
            <button type="button" className="btn-ghost-sm" onClick={() => { setF(formDesde(carrera)); setAviso('') }} disabled={guardando}>Descartar cambios</button>
            <button type="submit" className="btn-primary-sm" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </form>

        <section id="pc-imagenes" className="pc-sheet">
          <h3 className="pc-legend">Imágenes</h3>
          <p className="pc-hint">Cada imagen se guarda apenas la elegís.</p>
          <div className="pc-imgs">
            {IMAGENES.map(img => (
              <div key={img.campo} className="pc-img">
                <strong>{img.titulo}</strong>
                <span className="pc-hint">{img.ayuda}</span>
                <div className="pc-img-box" style={{ aspectRatio: img.ratio }}>
                  {subiendo === img.campo ? 'Subiendo…' : carrera[img.campo] ? <img src={carrera[img.campo]} alt={img.titulo} /> : 'Sin imagen'}
                </div>
                <div className="pc-row">
                  <label className="btn-outline-sm pc-file">{carrera[img.campo] ? 'Cambiar' : 'Subir'}
                    <input type="file" accept="image/*" disabled={!!subiendo} onChange={e => { subirImagen(img, e.target.files[0]); e.target.value = '' }} />
                  </label>
                  {carrera[img.campo] && <button className="btn-danger-sm" disabled={!!subiendo} onClick={() => quitarImagen(img)}>Quitar</button>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="pc-cobro" className="pc-sheet">
          <h3 className="pc-legend">Cobro por QR</h3>
          <div className="pc-qr">
            <div className="pc-img-box" style={{ aspectRatio: '1', maxWidth: 160 }}>
              {carrera.paymentQrUrl ? <img src={carrera.paymentQrUrl} alt="QR de cobro actual" /> : 'Sin QR'}
            </div>
            <div>
              <p className="pc-hint">El QR que ven las corredoras al pagar. El monto es el precio de la carrera.</p>
              <div className="pc-row">
                <label className="btn-outline-sm pc-file">Elegir imagen
                  <input type="file" accept="image/*" onChange={e => setQrFile(e.target.files[0] || null)} />
                </label>
                {qrFile && <span className="pc-hint">{qrFile.name}</span>}
                <button className="btn-primary-sm" disabled={!qrFile || subiendo === 'qr'} onClick={subirQr}>{subiendo === 'qr' ? 'Subiendo…' : 'Guardar QR'}</button>
              </div>
            </div>
          </div>
        </section>

        <section id="pc-delicado" className="pc-sheet pc-danger">
          <h3 className="pc-legend">Acciones delicadas</h3>
          {!carrera.rehearsalOfId && (
            <div className="pc-action">
              <div><strong>{carrera.published ? 'Ocultar de la web y la app' : 'Publicar'}</strong>
                <span className="pc-hint">{carrera.published ? 'Deja de verse; las inscritas no se pierden.' : 'La carrera aparece en la web y en la app.'}</span></div>
              <button className="btn-outline-sm" onClick={() => accion(() => carrera.published ? unpublishMarathon(token, carrera.id) : publishMarathon(token, carrera.id), carrera.published ? 'Carrera ocultada' : 'Carrera publicada')}>
                {carrera.published ? 'Ocultar' : 'Publicar'}
              </button>
            </div>
          )}
          <div className="pc-action">
            <div><strong>Exportar inscritas</strong><span className="pc-hint">Planilla para Excel con todas las inscritas.</span></div>
            <button className="btn-outline-sm" onClick={() => downloadRegistrantsCsv(token, carrera).catch(e => onError(e.message))}>Exportar a Excel</button>
          </div>
          {!carrera.rehearsalOfId && (
            <div className="pc-action">
              <div><strong>Crear ensayo</strong><span className="pc-hint">Copia privada para probar la largada con cuentas de prueba.</span></div>
              <button className="btn-outline-sm" onClick={ensayo}>Crear ensayo</button>
            </div>
          )}
          {enVivo && (
            <div className="pc-action">
              <div><strong>Reiniciar en vivo</strong><span className="pc-hint">Quita preparación, largada y cierre.</span></div>
              <button className="btn-outline-sm" onClick={reiniciar}>Reiniciar</button>
            </div>
          )}
          <div className="pc-action">
            <div><strong>Eliminar carrera</strong><span className="pc-hint">No se puede deshacer.</span></div>
            <button className="btn-danger-sm" onClick={eliminar}>Eliminar</button>
          </div>
        </section>
      </div>
    </div>
  )
}

function Inscritas({ token, carrera }) {
  const [filas, setFilas] = useState([])
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [recibo, setRecibo] = useState(null)

  async function cargar(p = page) {
    setCargando(true); setError('')
    try {
      const r = await getAdminRegistrations(token, { marathonId: carrera.id, status: 'confirmed', search: busqueda.trim(), page: p, limit: 40 })
      setFilas(r.data || [])
      setMeta({ total: r.meta?.total || 0, totalPages: r.meta?.totalPages || 1 })
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar(page) }, [page])

  function buscar(e) {
    e.preventDefault()
    if (page === 1) cargar(1); else setPage(1)
  }

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <h2>Inscritas ({num(meta.total)})</h2>
        <form className="dash-search-bar" onSubmit={buscar}>
          <input type="search" className="dash-search-input" placeholder="Nombre, CI, celular o email" value={busqueda} onChange={e => setBusqueda(e.target.value)} aria-label="Buscar inscrita" />
          <button className="btn-outline-sm">Buscar</button>
          <button type="button" className="btn-outline-sm" onClick={() => downloadRegistrantsCsv(token, carrera).catch(e => setError(e.message))}>Exportar a Excel</button>
        </form>
      </div>
      {error && <p className="dash-error" style={{ margin: '1rem 2rem' }}>{error}</p>}
      {cargando ? <div className="dash-loading">Cargando…</div> : filas.length === 0 ? (
        <div className="dash-empty"><p>{busqueda ? 'Nadie coincide con esa búsqueda.' : 'Todavía no hay inscritas con el pago validado.'}</p></div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="dash-table">
              <thead><tr><th>Corredora</th><th>CI</th><th>Celular</th><th>Dorsal</th><th>Total</th><th>Recibo</th></tr></thead>
              <tbody>
                {filas.map(r => (
                  <tr key={r.id}>
                    <td><div className="cell-name">{r.runner}</div><div className="cell-sub">{r.email}</div></td>
                    <td>{r.docId || '—'}</td>
                    <td>{r.phone || '—'}</td>
                    <td>{r.bibNumber || '—'}</td>
                    <td>{bs(r.totalCents)}</td>
                    <td><button className="btn-outline-sm" onClick={() => setRecibo({
                      receiptNumber: String(r.id).slice(-8).toUpperCase(), paymentId: r.id, donor: r.runner, concept: r.marathon,
                      amountCents: r.totalCents, currency: 'Bolivianos', currencySymbol: 'Bs', date: new Date(),
                    })}>Recibo</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button className="btn-outline-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Página anterior">←</button>
            <span>Página {page} de {meta.totalPages}</span>
            <button className="btn-outline-sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} aria-label="Página siguiente">→</button>
          </div>
        </>
      )}
      {recibo && <DonationReceipt data={recibo} onClose={() => setRecibo(null)} />}
    </div>
  )
}

function NuevaCarrera({ token, onCerrar, onCreada }) {
  const [f, setF] = useState({ name: '', city: 'La Paz', startsAt: '', distanceMeters: '', capacity: '', price: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const campo = e => setF(prev => ({ ...prev, [e.target.name]: e.target.value }))

  async function crear(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      onCreada(await createMarathon(token, {
        name: f.name,
        city: f.city,
        startsAt: new Date(f.startsAt).toISOString(),
        distanceMeters: parseInt(f.distanceMeters, 10),
        capacity: parseInt(f.capacity, 10),
        priceCents: Math.round(parseFloat(f.price) * 100),
      }))
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="pc-nueva" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2 id="pc-nueva">Nueva carrera</h2><button className="modal-close" onClick={onCerrar} aria-label="Cerrar">×</button></div>
        <form onSubmit={crear}>
          <div className="modal-body">
            <p className="pc-hint" style={{ marginBottom: '1rem' }}>Lo básico para crearla. El resto lo completás después en Editar carrera; queda en borrador hasta que la publiques.</p>
            <label className="form-label">Nombre<input className="form-input" name="name" required autoFocus value={f.name} onChange={campo} /></label>
            <label className="form-label">Ciudad<input className="form-input" name="city" required value={f.city} onChange={campo} /></label>
            <label className="form-label">Largada<input className="form-input" type="datetime-local" name="startsAt" required value={f.startsAt} onChange={campo} /></label>
            <label className="form-label">Distancia (m)<input className="form-input" type="number" min="1" name="distanceMeters" required value={f.distanceMeters} onChange={campo} /></label>
            <label className="form-label">Cupos<input className="form-input" type="number" min="1" name="capacity" required value={f.capacity} onChange={campo} /></label>
            <label className="form-label">Precio (Bs)<input className="form-input" type="number" min="0" step="0.01" name="price" required value={f.price} onChange={campo} /></label>
            {error && <p className="dash-error">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost-sm" onClick={onCerrar}>Cancelar</button>
            <button className="btn-primary-sm" disabled={guardando}>{guardando ? 'Creando…' : 'Crear carrera'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
