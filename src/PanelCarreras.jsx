import { useEffect, useMemo, useRef, useState } from 'react'
import DonationReceipt from './components/DonationReceipt'
import { DailyChart, Donut, Funnel, HBars, Icon, Sparkline } from './components/AdminCharts'
import './admin.css'
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
  ['datos', 'Datos generales', 'flag'],
  ['inscripcion', 'Inscripción', 'ticket'],
  ['incluye', 'Qué incluye', 'package'],
  ['cronograma', 'Cronograma', 'clock'],
  ['kit', 'Retiro de kit', 'pin'],
  ['imagenes', 'Imágenes', 'image'],
  ['cobro', 'Cobro por QR', 'qr'],
  ['delicado', 'Acciones delicadas', 'shield'],
]

const VISTAS = [['resumen', 'Resumen', 'chart'], ['editar', 'Editar carrera', 'edit'], ['inscritas', 'Inscritas', 'users']]

const ESTADO_INSCRIPCION = { open: 'Inscripciones abiertas', closing_soon: 'Por cerrar', full: 'Cupos llenos', closed: 'Inscripciones cerradas' }
const EDADES = ['<18', '18-29', '30-39', '40-49', '50-59', '60+']
const COLOR = { si: '#8B5CF6', no: '#C4B5FD', sin: '#E2DCF5' }

const bs = cents => `Bs ${((cents || 0) / 100).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const num = n => (n ?? 0).toLocaleString('es-BO')
const fecha = (iso, o = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(iso).toLocaleDateString('es-BO', o)
const iniciales = nombre => (nombre || '?').split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
const faltan = iso => Math.ceil((new Date(iso) - Date.now()) / 864e5)

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

const miniatura = c => c.logoHorizontalUrl || c.coverUrl || c.logoVerticalUrl

function Miniatura({ carrera, size = 40 }) {
  const src = miniatura(carrera)
  return (
    <span className="ad-thumb" style={{ width: size, height: size }} aria-hidden="true">
      {src ? <img src={src} alt="" /> : iniciales(carrera.name)}
    </span>
  )
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

  if (cargando) return <div className="ad ad-loading"><span className="ad-spinner" /> Cargando carreras…</div>

  const vista = VISTAS.find(v => v[0] === tab)

  return (
    <div className="ad">
      <aside className="ad-side">
        <SelectorCarrera carreras={carreras} sel={sel} onElegir={id => setSelId(id)} onNueva={() => setNueva(true)} />
        {sel && (
          <nav className="ad-nav" aria-label="Secciones de la carrera">
            {VISTAS.map(([k, l, ic]) => (
              <button key={k} className={`ad-nav-item${tab === k ? ' is-on' : ''}`} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
                <Icon name={ic} />{l}
                {k === 'inscritas' && stats && <span className="ad-nav-n">{num(stats.confirmed)}</span>}
              </button>
            ))}
          </nav>
        )}
        {sel && <EstadoLateral carrera={sel} />}
      </aside>

      <main className="ad-main">
        {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}<button onClick={() => setError('')} aria-label="Cerrar aviso"><Icon name="x" size={16} /></button></p>}

        {!sel ? (
          <div className="ad-card ad-empty">
            <span className="ad-empty-ic"><Icon name="flag" size={28} /></span>
            <h2>Creá la primera carrera</h2>
            <p>Con la carrera creada vas a ver sus inscritas, lo recaudado y las visitas.</p>
            <button className="ad-btn is-primary" onClick={() => setNueva(true)}><Icon name="plus" />Nueva carrera</button>
          </div>
        ) : (
          <>
            <header className="ad-head">
              <div>
                <p className="ad-eyebrow">{vista[1]}</p>
                <h1>{sel.name}</h1>
                <p className="ad-head-meta">
                  <span><Icon name="calendar" size={15} />{fecha(sel.startsAt, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  <span><Icon name="pin" size={15} />{sel.city}</span>
                  <span className={`ad-pill ${sel.rehearsalOfId ? 'is-gold' : sel.published ? 'is-ok' : ''}`}>{sel.rehearsalOfId ? 'Ensayo' : sel.published ? 'Publicada' : 'Borrador'}</span>
                </p>
              </div>
              <button className="ad-btn" onClick={() => downloadRegistrantsCsv(token, sel).catch(e => setError(e.message))}><Icon name="download" />Exportar inscritas</button>
            </header>

            {tab === 'resumen' && <Resumen carrera={sel} stats={stats} statsError={statsError} />}
            {tab === 'editar' && (detalle
              ? <EditorCarrera key={detalle.id} token={token} carrera={detalle} onCambio={setDetalle} onGuardado={refrescar}
                  onEliminada={() => { setSelId(''); cargarCarreras(); setTab('resumen') }} onError={setError} />
              : <div className="ad-loading"><span className="ad-spinner" /> Cargando carrera…</div>)}
            {tab === 'inscritas' && <Inscritas key={sel.id} token={token} carrera={sel} />}
          </>
        )}
      </main>

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

/// Reemplaza al <select>: con miniatura, fecha y estado se reconoce la carrera de un vistazo.
function SelectorCarrera({ carreras, sel, onElegir, onNueva }) {
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const caja = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = e => { if (!caja.current?.contains(e.target)) setAbierto(false) }
    const esc = e => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc) }
  }, [abierto])

  const filtro = q.trim().toLowerCase()
  const visibles = carreras.filter(c => !filtro || `${c.name} ${c.city}`.toLowerCase().includes(filtro))
  const grupos = [['Carreras', visibles.filter(c => !c.rehearsalOfId)], ['Ensayos', visibles.filter(c => c.rehearsalOfId)]]

  function elegir(id) { onElegir(id); setAbierto(false); setQ('') }

  return (
    <div className="ad-switch" ref={caja}>
      <p className="ad-side-label">Carrera</p>
      <button className="ad-switch-btn" aria-haspopup="listbox" aria-expanded={abierto} onClick={() => setAbierto(a => !a)}>
        {sel ? <Miniatura carrera={sel} /> : <span className="ad-thumb"><Icon name="flag" /></span>}
        <span className="ad-switch-txt">
          <strong>{sel?.name || 'Sin carreras'}</strong>
          {sel && <small>{fecha(sel.startsAt)} · {sel.city}</small>}
        </span>
        <Icon name="chevron" className={`ad-switch-chev${abierto ? ' is-up' : ''}`} />
      </button>

      {abierto && (
        <div className="ad-pop">
          {carreras.length > 5 && (
            <label className="ad-pop-search"><Icon name="search" size={16} />
              <input autoFocus placeholder="Buscar carrera" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar carrera" />
            </label>
          )}
          <div className="ad-pop-list" role="listbox" aria-label="Carreras">
            {visibles.length === 0 && <p className="ad-pop-empty">Ninguna coincide.</p>}
            {grupos.map(([titulo, lista]) => lista.length > 0 && (
              <div key={titulo} role="group" aria-label={titulo}>
                <p className="ad-pop-group">{titulo}</p>
                {lista.map(c => {
                  const estado = c.rehearsalOfId ? 'Ensayo' : c.published ? 'Publicada' : 'Borrador'
                  return (
                    <button key={c.id} role="option" aria-selected={c.id === sel?.id} className={`ad-pop-item${c.id === sel?.id ? ' is-on' : ''}`} onClick={() => elegir(c.id)}>
                      <Miniatura carrera={c} size={36} />
                      <span className="ad-switch-txt">
                        <strong>{c.name}</strong>
                        <small><i className={`ad-state is-${estado.toLowerCase()}`} />{estado} · {fecha(c.startsAt)}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          <button className="ad-pop-new" onClick={() => { setAbierto(false); onNueva() }}><Icon name="plus" />Nueva carrera</button>
        </div>
      )}
    </div>
  )
}

function EstadoLateral({ carrera }) {
  const d = faltan(carrera.startsAt)
  const abiertas = carrera.registrationStatus !== 'closed' && carrera.registrationStatus !== 'full'
  return (
    <div className="ad-side-card">
      <p className="ad-side-count"><strong>{d > 0 ? d : 0}</strong>{d > 1 ? 'días para la largada' : d === 1 ? 'día para la largada' : d === 0 ? 'Hoy es la largada' : 'Carrera finalizada'}</p>
      <p className={`ad-side-state${abiertas ? ' is-on' : ''}`}><i />{ESTADO_INSCRIPCION[carrera.registrationStatus] || carrera.registrationStatus}</p>
    </div>
  )
}

function Resumen({ carrera, stats, statsError }) {
  const [modo, setModo] = useState('inscritas')

  const s = stats
  const daily = s?.daily || []
  const ult7 = daily.slice(-7).reduce((t, d) => t + d.confirmed, 0)
  const prev7 = daily.slice(-14, -7).reduce((t, d) => t + d.confirmed, 0)
  const ticket = s?.paymentsPaid ? s.revenueCents / s.paymentsPaid : 0
  const est = s?.registrationsByStatus || {}
  const iniciadas = Object.values(est).reduce((t, n) => t + n, 0)
  const alPago = (est.pending_payment || 0) + (est.confirmed || 0) + (est.refunded || 0)
  const dias = faltan(carrera.startsAt)
  const ritmo = daily.length ? (s.confirmed / daily.length) : 0

  if (statsError) return <p className="ad-alert" role="alert"><Icon name="alert" />No se pudieron cargar las métricas: {statsError}</p>

  const sino = (obj, si, no) => [
    { label: si, value: obj?.si || 0, color: COLOR.si },
    { label: no, value: obj?.no || 0, color: COLOR.no },
    ...(obj?.sin_dato ? [{ label: 'Sin dato', value: obj.sin_dato, color: COLOR.sin }] : []),
  ]
  const categorias = Object.entries(s?.categories || {}).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  const edades = [...EDADES, 'sin_dato'].filter(k => k !== 'sin_dato' || s?.ages?.sin_dato).map(k => ({ label: k === 'sin_dato' ? 'Sin dato' : `${k} años`.replace('<18 años', 'Menos de 18'), value: s?.ages?.[k] || 0 }))
  const pct = (a, b) => b ? Math.round((a / b) * 100) : 0

  return (
    <div className="ad-resumen" aria-busy={!s}>
      <div className="ad-kpis">
        <Kpi icon="users" label="Inscritas confirmadas" value={s && num(s.confirmed)}
          delta={s && (ult7 || prev7) ? { n: ult7, sube: ult7 >= prev7, txt: `+${num(ult7)} últimos 7 días` } : null}
          spark={daily.map(d => d.confirmed)} />
        <Kpi icon="coins" label="Total recaudado" value={s && bs(s.revenueCents)}
          nota={s && (ticket ? `Ticket promedio ${bs(ticket)}` : 'Sin cobros validados todavía')}
          spark={daily.map(d => d.revenueCents)} tono="gold" />
        <Kpi icon="receipt" label="Cobros por validar" value={s && num(s.paymentsPending)}
          nota={s && (s.proofsInReview ? `${num(s.proofsInReview)} con comprobante esperando` : 'Nada pendiente de revisión')}
          tono={s?.paymentsPending > 0 ? 'warn' : 'ok'} />
        <Kpi icon="clock" label={dias >= 0 ? 'Días para la largada' : 'Días desde la largada'} value={num(Math.abs(dias))}
          nota={s && (ritmo ? `Ritmo de ${ritmo.toFixed(1)} inscritas por día` : fecha(carrera.startsAt))} tono="deep" />
      </div>

      <div className="ad-row ad-row-main">
        <section className="ad-card ad-chart-card">
          <header className="ad-card-head">
            <div>
              <h2>Ritmo de inscripciones</h2>
              <p>Cobros validados por día. La línea es el acumulado.</p>
            </div>
            <div className="ad-seg" role="radiogroup" aria-label="Qué mostrar">
              {[['inscritas', 'Inscritas'], ['dinero', 'Recaudado']].map(([k, l]) => (
                <button key={k} role="radio" aria-checked={modo === k} className={modo === k ? 'is-on' : ''} onClick={() => setModo(k)}>{l}</button>
              ))}
            </div>
          </header>
          {!s ? <div className="ad-skel ad-skel-chart" /> : daily.every(d => !d.confirmed)
            ? <EmptyChart texto="Cuando se validen los primeros cobros vas a ver acá el ritmo diario." />
            : <DailyChart data={daily} modo={modo} formato={modo === 'dinero' ? bs : num} />}
        </section>

        <section className="ad-card">
          <header className="ad-card-head">
            <div><h2>Embudo</h2><p>De la visita a la inscripción confirmada.</p></div>
          </header>
          {!s ? <div className="ad-skel ad-skel-list" /> : (
            <>
              <Funnel pasos={[
                { label: 'Vieron la carrera', value: s.marathonViews },
                { label: 'Empezaron a inscribirse', value: iniciadas },
                { label: 'Llegaron al pago', value: alPago },
                { label: 'Confirmadas', value: s.confirmed },
              ]} />
              <p className="ad-foot"><Icon name="trend" size={15} />Conversión total <b>{s.marathonViews ? ((s.confirmed / s.marathonViews) * 100).toFixed(1) : '—'}%</b> · {num(s.pageViews)} visitas al inicio</p>
            </>
          )}
        </section>
      </div>

      <div className="ad-row ad-row-3">
        <section className="ad-card">
          <header className="ad-card-head"><div><h2>Conocen el CAM</h2><p>Lo que respondieron al inscribirse.</p></div></header>
          {!s ? <div className="ad-skel ad-skel-donut" /> : s.confirmed === 0 ? <EmptyChart texto="Sin inscritas todavía." />
            : <Donut label="Conocen el CAM" centro={`${pct(s.knowsCam?.si || 0, s.confirmed)}%`} partes={sino(s.knowsCam, 'Ya lo conocían', 'No lo conocían')} />}
        </section>
        <section className="ad-card">
          <header className="ad-card-head"><div><h2>Posibles donantes</h2><p>Aceptan que el CAM las llame.</p></div></header>
          {!s ? <div className="ad-skel ad-skel-donut" /> : s.confirmed === 0 ? <EmptyChart texto="Sin inscritas todavía." />
            : <Donut label="Aceptan llamada de donante" centro={num(s.acceptsDonorCall?.si || 0)} partes={sino(s.acceptsDonorCall, 'Aceptan la llamada', 'Prefieren que no')} />}
        </section>
        <section className="ad-card">
          <header className="ad-card-head"><div><h2>Edades</h2><p>A la fecha de la largada.</p></div></header>
          {!s ? <div className="ad-skel ad-skel-list" /> : s.confirmed === 0 ? <EmptyChart texto="Sin inscritas todavía." /> : <HBars filas={edades} />}
        </section>
      </div>

      {categorias.length > 1 && (
        <section className="ad-card">
          <header className="ad-card-head"><div><h2>Por categoría</h2><p>Inscritas confirmadas en cada categoría.</p></div></header>
          <HBars filas={categorias} />
        </section>
      )}
    </div>
  )
}

function EmptyChart({ texto }) {
  return <div className="ad-chart-empty"><Icon name="chart" size={22} /><p>{texto}</p></div>
}

function Kpi({ icon, label, value, nota, delta, spark, tono = 'violet' }) {
  return (
    <div className={`ad-kpi is-${tono}`}>
      <div className="ad-kpi-top">
        <span className="ad-kpi-ic"><Icon name={icon} /></span>
        <span className="ad-kpi-label">{label}</span>
      </div>
      {value == null ? <span className="ad-skel ad-skel-num" aria-label="Cargando" /> : <strong className="ad-kpi-value">{value}</strong>}
      {delta ? <span className={`ad-delta${delta.sube ? ' is-up' : ''}`}><Icon name="trend" size={14} />{delta.txt}</span>
        : nota ? <span className="ad-kpi-note">{nota}</span> : null}
      {spark?.some(Boolean) && <Sparkline values={spark} label={`Tendencia de ${label.toLowerCase()}`} />}
    </div>
  )
}

function Seccion({ id, icon, titulo, desc, children, extra, peligro }) {
  return (
    <section id={`pc-${id}`} className={`ad-card ad-sec${peligro ? ' is-danger' : ''}`}>
      <header className="ad-sec-head">
        <span className="ad-sec-ic"><Icon name={icon} /></span>
        <div><h2>{titulo}</h2>{desc && <p>{desc}</p>}</div>
        {extra}
      </header>
      {children}
    </section>
  )
}

function Campo({ label, ayuda, span, children }) {
  return (
    <label className={`ad-field${span ? ' is-span' : ''}`}>
      <span>{label}</span>
      {children}
      {ayuda && <small>{ayuda}</small>}
    </label>
  )
}

function EditorCarrera({ token, carrera, onCambio, onGuardado, onEliminada, onError }) {
  const [f, setF] = useState(() => formDesde(carrera))
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [subiendo, setSubiendo] = useState('')
  const [qrFile, setQrFile] = useState(null)
  const [activa, setActiva] = useState('datos')

  const original = useMemo(() => JSON.stringify(formDesde(carrera)), [carrera])
  const sucio = JSON.stringify(f) !== original

  // El aviso flota abajo: las acciones del final de la hoja quedan lejos de la barra de guardado
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  // Resalta en el índice la sección que se está leyendo
  useEffect(() => {
    const obs = new IntersectionObserver(es => {
      const vis = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (vis) setActiva(vis.target.id.slice(3))
    }, { rootMargin: '-100px 0px -60% 0px' })
    SECCIONES.forEach(([id]) => { const el = document.getElementById(`pc-${id}`); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

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
  const km = (parseInt(f.distanceMeters, 10) || 0) * (parseInt(f.laps, 10) || 1) / 1000
  const portada = miniatura(carrera)
  // Lo que falta completar, para el punto del índice
  const completa = {
    datos: f.name && f.city && f.startsAt && f.description,
    inscripcion: f.capacity,
    incluye: f.includes.trim(),
    cronograma: f.schedule.length > 0,
    kit: f.kitAddress.trim(),
    imagenes: IMAGENES.some(i => carrera[i.campo]),
    cobro: carrera.paymentQrUrl || carrera.paymentQrPayload,
  }

  return (
    <div className="ad-editor">
      <p className={`ad-toast${aviso ? ' is-on' : ''}`} role="status" aria-live="polite"><Icon name="check" size={16} />{aviso}</p>

      <nav className="ad-index" aria-label="Partes de la carrera">
        {SECCIONES.map(([id, t, ic]) => (
          <a key={id} href={`#pc-${id}`} className={activa === id ? 'is-on' : ''} aria-current={activa === id ? 'true' : undefined}>
            <Icon name={ic} size={16} />{t}
            {id in completa && <i className={`ad-dotc${completa[id] ? ' is-ok' : ''}`} title={completa[id] ? 'Completo' : 'Falta completar'} />}
          </a>
        ))}
      </nav>

      <div className="ad-sheets">
        <div className="ad-preview" style={portada ? { '--img': `url("${portada}")` } : undefined}>
          <div className="ad-preview-in">
            <span className="ad-pill is-glass">Vista previa</span>
            <h2>{f.name || 'Sin nombre'}</h2>
            <p>
              {f.startsAt && <span><Icon name="calendar" size={15} />{fecha(f.startsAt, { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>}
              {f.city && <span><Icon name="pin" size={15} />{f.city}</span>}
              {km > 0 && <span><Icon name="flag" size={15} />{km.toLocaleString('es-BO', { maximumFractionDigits: 2 })} km{f.laps > 1 ? ` · ${f.laps} vueltas` : ''}</span>}
            </p>
          </div>
          <strong className="ad-preview-price">{f.price ? bs(Math.round(parseFloat(f.price) * 100)) : '—'}</strong>
        </div>

        <form onSubmit={guardar} className="ad-form" id="ad-form">
          <Seccion id="datos" icon="flag" titulo="Datos generales" desc="Lo que ven las corredoras en la web y en la app.">
            <div className="ad-grid">
              <Campo label="Nombre" span><input name="name" required value={f.name} onChange={campo} /></Campo>
              <Campo label="Dirección web" ayuda="Minúsculas, números y guiones">
                <input name="slug" value={f.slug} onChange={campo} pattern="[a-z0-9-]+" title="Minúsculas, números y guiones" />
              </Campo>
              <Campo label="Ciudad"><input name="city" required value={f.city} onChange={campo} /></Campo>
              <Campo label="Largada"><input type="datetime-local" name="startsAt" required value={f.startsAt} onChange={campo} /></Campo>
              <Campo label="Precio">
                <span className="ad-affix"><em>Bs</em><input type="number" min="0" step="0.01" name="price" required value={f.price} onChange={campo} /></span>
              </Campo>
              <Campo label="Distancia de una vuelta">
                <span className="ad-affix is-end"><input type="number" min="1" name="distanceMeters" required value={f.distanceMeters} onChange={campo} /><em>m</em></span>
              </Campo>
              <Campo label="Vueltas" ayuda={km > 0 ? `Total: ${km.toLocaleString('es-BO', { maximumFractionDigits: 2 })} km` : null}>
                <input type="number" min="1" name="laps" required value={f.laps} onChange={campo} />
              </Campo>
              <Campo label="Descripción" span ayuda={`${f.description.length} / 4000`}><textarea rows="5" name="description" maxLength={4000} value={f.description} onChange={campo} /></Campo>
            </div>
          </Seccion>

          <Seccion id="inscripcion" icon="ticket" titulo="Inscripción" desc="Cuántas pueden inscribirse y hasta cuándo.">
            <div className="ad-grid">
              <Campo label="Cupos"><input type="number" min="1" name="capacity" required value={f.capacity} onChange={campo} /></Campo>
              <Campo label="Cierre automático" ayuda="Vacío: quedan abiertas hasta que las cierres."><input type="datetime-local" name="registrationClosesAt" value={f.registrationClosesAt} onChange={campo} /></Campo>
            </div>
            <div className="ad-toggle-row">
              <div>
                <strong>{ESTADO_INSCRIPCION[carrera.registrationStatus] || carrera.registrationStatus}</strong>
                <small>{cerradas ? 'Nadie puede inscribirse ahora.' : 'Las corredoras pueden inscribirse.'} Se aplica al instante.</small>
              </div>
              <button type="button" role="switch" aria-checked={!cerradas} aria-label="Inscripciones abiertas" className={`ad-switch-tg${!cerradas ? ' is-on' : ''}`}
                onClick={() => accion(() => setRegistrationsOpen(token, carrera.id, cerradas), cerradas ? 'Inscripciones abiertas' : 'Inscripciones cerradas')}><i /></button>
            </div>
          </Seccion>

          <Seccion id="incluye" icon="package" titulo="Qué incluye" desc="Una cosa por línea. Se muestra como lista.">
            <div className="ad-split">
              <Campo label="Elementos"><textarea rows="5" name="includes" value={f.includes} onChange={campo} placeholder={'Polera\nMedalla\nHidratación'} /></Campo>
              <ul className="ad-chips" aria-label="Así se ve">
                {f.includes.split('\n').map(s => s.trim()).filter(Boolean).map((s, i) => <li key={i}><Icon name="check" size={14} />{s}</li>)}
              </ul>
            </div>
          </Seccion>

          <Seccion id="cronograma" icon="clock" titulo="Cronograma" desc="Acreditación, largada, premiación…"
            extra={<button type="button" className="ad-btn is-sm" onClick={() => set('schedule', [...f.schedule, { time: '', title: '', description: '' }])}><Icon name="plus" size={16} />Agregar</button>}>
            {f.schedule.length === 0 ? <p className="ad-hint">Sin horarios cargados.</p> : (
              <ol className="ad-timeline">
                {f.schedule.map((s, i) => (
                  <li key={i}>
                    <input type="time" aria-label="Hora" value={s.time} onChange={e => setFila(i, 'time', e.target.value)} />
                    <input aria-label="Qué pasa" placeholder="Largada" value={s.title} onChange={e => setFila(i, 'title', e.target.value)} />
                    <input aria-label="Detalle" placeholder="Detalle (opcional)" value={s.description} onChange={e => setFila(i, 'description', e.target.value)} />
                    <button type="button" className="ad-icon-btn is-danger" aria-label="Quitar horario" onClick={() => set('schedule', f.schedule.filter((_, j) => j !== i))}><Icon name="trash" size={16} /></button>
                  </li>
                ))}
              </ol>
            )}
          </Seccion>

          <Seccion id="kit" icon="pin" titulo="Retiro de kit" desc="Dejá la dirección vacía si no hay retiro.">
            <div className="ad-grid">
              <Campo label="Dirección" span><input name="kitAddress" value={f.kitAddress} onChange={campo} placeholder="Ej.: Av. Ballivián 1234, Calacoto" /></Campo>
              <Campo label="Desde"><input type="datetime-local" name="kitFrom" value={f.kitFrom} onChange={campo} /></Campo>
              <Campo label="Hasta"><input type="datetime-local" name="kitTo" value={f.kitTo} onChange={campo} /></Campo>
            </div>
          </Seccion>
        </form>

        <Seccion id="imagenes" icon="image" titulo="Imágenes" desc="Cada imagen se guarda apenas la elegís.">
          <div className="ad-imgs">
            {IMAGENES.map(img => (
              <div key={img.campo} className="ad-img">
                <div className="ad-img-box" style={{ aspectRatio: img.ratio }}>
                  {subiendo === img.campo ? <span className="ad-spinner" /> : carrera[img.campo] ? <img src={carrera[img.campo]} alt={img.titulo} /> : <><Icon name="image" size={26} /><span>Sin imagen</span></>}
                </div>
                <strong>{img.titulo}</strong>
                <small>{img.ayuda}</small>
                <div className="ad-img-actions">
                  <label className="ad-btn is-sm ad-file">{carrera[img.campo] ? 'Cambiar' : 'Subir'}
                    <input type="file" accept="image/*" disabled={!!subiendo} onChange={e => { subirImagen(img, e.target.files[0]); e.target.value = '' }} />
                  </label>
                  {carrera[img.campo] && <button className="ad-icon-btn is-danger" disabled={!!subiendo} onClick={() => quitarImagen(img)} aria-label={`Quitar ${img.titulo}`}><Icon name="trash" size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion id="cobro" icon="qr" titulo="Cobro por QR" desc="El QR que ven las corredoras al pagar. El monto es el precio de la carrera.">
          <div className="ad-qr">
            <div className="ad-img-box is-qr">
              {carrera.paymentQrUrl ? <img src={carrera.paymentQrUrl} alt="QR de cobro actual" /> : <><Icon name="qr" size={26} /><span>Sin QR</span></>}
            </div>
            <div className="ad-qr-side">
              <Campo label="Instrucciones junto al QR" ayuda="Se guardan con los demás cambios.">
                <textarea form="ad-form" rows="3" maxLength={500} name="paymentQrInstructions" value={f.paymentQrInstructions} onChange={campo} placeholder="Ej.: poné tu CI en la glosa" />
              </Campo>
              <div className="ad-img-actions">
                <label className="ad-btn is-sm ad-file">Elegir imagen
                  <input type="file" accept="image/*" onChange={e => setQrFile(e.target.files[0] || null)} />
                </label>
                {qrFile && <span className="ad-hint">{qrFile.name}</span>}
                <button className="ad-btn is-sm is-primary" disabled={!qrFile || subiendo === 'qr'} onClick={subirQr}>{subiendo === 'qr' ? 'Subiendo…' : 'Guardar QR'}</button>
              </div>
            </div>
          </div>
        </Seccion>

        <Seccion id="delicado" icon="shield" titulo="Acciones delicadas" desc="Se aplican al instante." peligro>
          <div className="ad-actions">
            {!carrera.rehearsalOfId && (
              <Accion titulo={carrera.published ? 'Ocultar de la web y la app' : 'Publicar'}
                desc={carrera.published ? 'Deja de verse; las inscritas no se pierden.' : 'La carrera aparece en la web y en la app.'}>
                <button className="ad-btn is-sm" onClick={() => accion(() => carrera.published ? unpublishMarathon(token, carrera.id) : publishMarathon(token, carrera.id), carrera.published ? 'Carrera ocultada' : 'Carrera publicada')}>
                  {carrera.published ? 'Ocultar' : 'Publicar'}
                </button>
              </Accion>
            )}
            {!carrera.rehearsalOfId && (
              <Accion titulo="Crear ensayo" desc="Copia privada para probar la largada con cuentas de prueba.">
                <button className="ad-btn is-sm" onClick={ensayo}>Crear ensayo</button>
              </Accion>
            )}
            {enVivo && (
              <Accion titulo="Reiniciar en vivo" desc="Quita preparación, largada y cierre.">
                <button className="ad-btn is-sm" onClick={reiniciar}>Reiniciar</button>
              </Accion>
            )}
            <Accion titulo="Eliminar carrera" desc="No se puede deshacer.">
              <button className="ad-btn is-sm is-danger" onClick={eliminar}><Icon name="trash" size={16} />Eliminar</button>
            </Accion>
          </div>
        </Seccion>
      </div>

      <div className={`ad-savebar${sucio ? ' is-dirty' : ''}`}>
        <span className="ad-savebar-state"><i />{sucio ? 'Tenés cambios sin guardar' : 'Todo guardado'}</span>
        <button type="button" className="ad-btn is-ghost" onClick={() => { setF(formDesde(carrera)); setAviso('') }} disabled={guardando || !sucio}>Descartar</button>
        <button type="submit" form="ad-form" className="ad-btn is-primary" disabled={guardando || !sucio}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>
    </div>
  )
}

function Accion({ titulo, desc, children }) {
  return <div className="ad-action"><div><strong>{titulo}</strong><small>{desc}</small></div>{children}</div>
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
    <section className="ad-card ad-table-card">
      <header className="ad-card-head">
        <div><h2>Inscritas confirmadas <span className="ad-count">{num(meta.total)}</span></h2><p>Solo las que ya tienen el pago validado.</p></div>
        <form className="ad-search" onSubmit={buscar} role="search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Nombre, CI, celular o email" value={busqueda} onChange={e => setBusqueda(e.target.value)} aria-label="Buscar inscrita" />
          <button className="ad-btn is-sm is-primary">Buscar</button>
        </form>
      </header>
      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
      {cargando ? <div className="ad-skel ad-skel-table" /> : filas.length === 0 ? (
        <div className="ad-chart-empty"><Icon name="users" size={22} /><p>{busqueda ? 'Nadie coincide con esa búsqueda.' : 'Todavía no hay inscritas con el pago validado.'}</p></div>
      ) : (
        <>
          <div className="ad-table-wrap">
            <table className="dash-table ad-table">
              <thead><tr><th>Corredora</th><th>CI</th><th>Celular</th><th>Dorsal</th><th>Total</th><th><span className="sr-only">Recibo</span></th></tr></thead>
              <tbody>
                {filas.map(r => (
                  <tr key={r.id}>
                    <td><div className="ad-person"><span className="ad-avatar" aria-hidden="true">{iniciales(r.runner)}</span><div><div className="cell-name">{r.runner}</div><div className="cell-sub">{r.email}</div></div></div></td>
                    <td>{r.docId || '—'}</td>
                    <td>{r.phone || '—'}</td>
                    <td>{r.bibNumber ? <span className="ad-bib">{r.bibNumber}</span> : '—'}</td>
                    <td className="ad-num">{bs(r.totalCents)}</td>
                    <td><button className="ad-btn is-sm is-ghost" onClick={() => setRecibo({
                      receiptNumber: String(r.id).slice(-8).toUpperCase(), paymentId: r.id, donor: r.runner, concept: r.marathon,
                      amountCents: r.totalCents, currency: 'Bolivianos', currencySymbol: 'Bs', date: new Date(),
                    })}><Icon name="receipt" size={16} />Recibo</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="ad-pager">
            <span>Página <b>{page}</b> de {meta.totalPages}</span>
            <div>
              <button className="ad-icon-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Página anterior"><Icon name="chevron" style={{ transform: 'rotate(90deg)' }} /></button>
              <button className="ad-icon-btn" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} aria-label="Página siguiente"><Icon name="chevron" style={{ transform: 'rotate(-90deg)' }} /></button>
            </div>
          </footer>
        </>
      )}
      {recibo && <DonationReceipt data={recibo} onClose={() => setRecibo(null)} />}
    </section>
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
      <div className="modal ad-modal" role="dialog" aria-modal="true" aria-labelledby="pc-nueva" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2 id="pc-nueva">Nueva carrera</h2><button className="modal-close" onClick={onCerrar} aria-label="Cerrar">×</button></div>
        <form onSubmit={crear}>
          <div className="modal-body">
            <p className="ad-hint">Lo básico para crearla. El resto lo completás después en Editar carrera; queda en borrador hasta que la publiques.</p>
            <div className="ad-grid">
              <Campo label="Nombre" span><input name="name" required autoFocus value={f.name} onChange={campo} /></Campo>
              <Campo label="Ciudad"><input name="city" required value={f.city} onChange={campo} /></Campo>
              <Campo label="Largada"><input type="datetime-local" name="startsAt" required value={f.startsAt} onChange={campo} /></Campo>
              <Campo label="Distancia"><span className="ad-affix is-end"><input type="number" min="1" name="distanceMeters" required value={f.distanceMeters} onChange={campo} /><em>m</em></span></Campo>
              <Campo label="Cupos"><input type="number" min="1" name="capacity" required value={f.capacity} onChange={campo} /></Campo>
              <Campo label="Precio" span><span className="ad-affix"><em>Bs</em><input type="number" min="0" step="0.01" name="price" required value={f.price} onChange={campo} /></span></Campo>
            </div>
            {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="ad-btn is-ghost" onClick={onCerrar}>Cancelar</button>
            <button className="ad-btn is-primary" disabled={guardando}>{guardando ? 'Creando…' : 'Crear carrera'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
