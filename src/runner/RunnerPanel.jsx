import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../components/AdminCharts'
import {
  changePassword, getHighlights, getMarathon, getMarathons, getMe, getMyRaces, getMyRacesSummary,
  getMyRegistrations, getWorkouts, getWorkoutWeeks, listaDe, removeAvatar, updateMe, uploadAvatar,
} from '../api'
import Inscripcion from './Inscripcion'
import Recibo from './Recibo'
import Arte from './Arte'
import { StoreBadges } from '../Landing'
import { ESTADO_CARRERA, ESTADO_INSCRIPCION, arte, bs, duracion, faltan, fecha, hora, km, puedeInscribirse, ritmo } from './util'
import './runner.css'

const TABS = [
  { key: 'carreras', label: 'Carreras', icon: 'flag' },
  { key: 'inscripciones', label: 'Mis carreras', icon: 'ticket' },
  { key: 'entrenos', label: 'Entrenos', icon: 'activity' },
  { key: 'perfil', label: 'Perfil', icon: 'user' },
]

export default function RunnerPanel({ sesion, onLogout }) {
  const token = sesion.accessToken
  const [tab, setTab] = useState(() => (sesion.user.mustChangePassword ? 'perfil' : 'carreras'))
  const [carreras, setCarreras] = useState(null)
  const [regs, setRegs] = useState([])
  const [races, setRaces] = useState([])
  const [resumen, setResumen] = useState(null)
  const [me, setMe] = useState(null)
  const [error, setError] = useState('')
  const [inscribiendo, setInscribiendo] = useState(null) // { carrera, inscripcion? }
  const [recibo, setRecibo] = useState(null)
  const [promo, setPromo] = useState(null)

  function cargar() {
    Promise.all([
      getMarathons(),
      getMyRegistrations(token),
      getMyRaces(token).then(listaDe).catch(() => []),
      getMyRacesSummary(token).catch(() => null),
    ]).then(([m, r, rc, s]) => { setCarreras(m); setRegs(r); setRaces(rc); setResumen(s) })
      .catch(e => { setError(e.message); setCarreras([]) })
  }
  useEffect(() => { cargar(); getMe(token).then(setMe).catch(() => {}) }, [token])

  // La inscripcion vigente de cada carrera: la confirmada gana a una pendiente
  const porCarrera = useMemo(() => {
    const orden = { confirmed: 3, pending_payment: 2, draft: 1 }
    const m = {}
    for (const r of regs) if (orden[r.status] && (orden[r.status] > (orden[m[r.marathon.id]?.status] || 0))) m[r.marathon.id] = r
    return m
  }, [regs])
  const carreraDe = id => carreras?.find(c => c.id === id)

  const avatar = me?.profile?.avatarUrl
  const debeCambiar = me ? me.mustChangePassword : sesion.user.mustChangePassword
  const nombre = me?.name || sesion.user.name || 'Corredor'

  function accion(c) {
    const r = porCarrera[c.id]
    if (r?.status === 'confirmed') return setRecibo(r)
    setInscribiendo({ carrera: c, inscripcion: r })
  }

  return (
    <div className="rn">
      <nav className="rn-top" aria-label="Panel del corredor">
        <a className="rn-brand" href="/"><img src="/logo.png" alt="" />CAM RUN</a>
        <div className="rn-tabs" role="tablist">
          {TABS.map(t => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'is-on' : ''} onClick={() => setTab(t.key)}>
              <Icon name={t.icon} size={20} /><span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="rn-me">
          <button className="rn-me-btn" onClick={() => setTab('perfil')} aria-label="Ir a mi perfil"><Avatar url={avatar} nombre={nombre} size={36} /></button>
          <button className="rn-icon-btn" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" size={18} /></button>
        </div>
      </nav>

      <header className="rn-wrap rn-hero">
        <div className="rn-hello">
          <Avatar url={avatar} nombre={nombre} size={64} ring />
          <div>
            <span className="rn-kicker">Panel del corredor</span>
            <h1>Hola, {nombre.split(' ')[0]}</h1>
          </div>
        </div>
        <div className="rn-hero-stats">
          <Stat label="Carreras corridas" valor={resumen?.racesCompleted ?? 0} />
          <Stat label="Km en carreras" valor={((resumen?.totalDistanceMeters || 0) / 1000).toFixed(1)} />
          <Stat label="Próximas" valor={resumen?.racesUpcoming ?? 0} />
        </div>
        {resumen?.nextRace && <ProximaLargada m={carreraDe(resumen.nextRace.marathon.id) || resumen.nextRace.marathon} onClick={setPromo} />}
      </header>

      <main className="rn-wrap rn-main">
        {debeCambiar && tab !== 'perfil' && (
          <button className="rn-banner" onClick={() => setTab('perfil')}><Icon name="lock" size={18} />Tu contraseña es temporal. Cambiala ahora<Icon name="arrow" size={16} /></button>
        )}
        {error && <p className="rn-error" role="alert"><Icon name="alert" size={16} />{error}</p>}
        <section key={tab} className="rn-panel" role="tabpanel">
          {tab === 'carreras' && <TabCarreras carreras={carreras} porCarrera={porCarrera} onAccion={accion} onPromo={setPromo} />}
          {tab === 'inscripciones' && <TabInscripciones regs={regs} races={races} carreraDe={carreraDe} cargando={!carreras}
            onRecibo={setRecibo} onSeguir={r => setInscribiendo({ carrera: carreraDe(r.marathon.id) || r.marathon, inscripcion: r })} onIr={() => setTab('carreras')} />}
          {tab === 'entrenos' && <TabEntrenos token={token} />}
          {tab === 'perfil' && <TabPerfil sesion={sesion} me={me} setMe={setMe} debeCambiar={debeCambiar} />}
        </section>
      </main>

      {promo && <Promo carrera={promo} reg={porCarrera[promo.id]} onClose={() => setPromo(null)} onAccion={c => { setPromo(null); accion(c) }} />}
      {inscribiendo && (
        <Inscripcion carrera={inscribiendo.carrera} inscripcion={inscribiendo.inscripcion} sesion={sesion} onCambio={cargar}
          onClose={() => { setInscribiendo(null); cargar() }}
          onVerRecibo={r => { setInscribiendo(null); setRecibo(r) }} />
      )}
      {recibo && <Recibo inscripcion={recibo} token={token} onClose={() => setRecibo(null)} />}
    </div>
  )
}

function Avatar({ url, nombre, size, ring }) {
  const [roto, setRoto] = useState(false)
  useEffect(() => setRoto(false), [url])
  return (
    <span className={`rn-avatar${ring ? ' has-ring' : ''}`} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {url && !roto ? <img src={url} alt="" onError={() => setRoto(true)} /> : nombre.slice(0, 1).toUpperCase()}
    </span>
  )
}

// Tarjeta clickeable: abre el afiche y los detalles de la carrera en la que estas inscrito
function ProximaLargada({ m, onClick }) {
  const d = new Date(m.startsAt)
  return (
    <button className="rn-next" onClick={() => onClick(m)} aria-label={`Ver detalles de ${m.name}`}>
      <span className="rn-next-media">
        <Arte carrera={m} proporcion={1} />
        <span className="rn-date"><b>{d.getDate()}</b>{d.toLocaleDateString('es-BO', { month: 'short' })}</span>
      </span>
      <span className="rn-next-info">
        <span className="rn-kicker"><span className="rn-pulse" />Tu próxima largada</span>
        <strong className="rn-next-name">{m.name}</strong>
        <span className="rn-meta is-sm">
          <span><Icon name="calendar" size={14} />{fecha(m.startsAt, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <span><Icon name="clock" size={14} />{hora(m.startsAt)}</span>
          {m.city && <span><Icon name="pin" size={14} />{m.city}</span>}
        </span>
        <span className="rn-next-more">Ver detalles de la carrera<Icon name="arrow" size={16} /></span>
      </span>
      <Countdown iso={m.startsAt} />
    </button>
  )
}

function Stat({ label, valor }) {
  return <div className="rn-stat"><strong>{valor}</strong><span>{label}</span></div>
}

function Countdown({ iso, compact }) {
  const [ahora, setAhora] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 1000); return () => clearInterval(t) }, [])
  const t = faltan(iso, ahora)
  if (!t.total) return <span className="rn-live"><span className="rn-pulse" />¡Es hoy!</span>
  const p = n => String(n).padStart(2, '0')
  const partes = [[t.dias, t.dias === 1 ? 'día' : 'días'], [p(t.horas), 'horas'], [p(t.min), 'min'], [p(t.seg), 'seg']]
  return (
    <span className={`rn-count${compact ? ' is-compact' : ''}`} role="timer" aria-label={`Faltan ${t.dias} días y ${t.horas} horas`}>
      {partes.map(([v, l], i) => (<Fragment key={l}>
        {i > 0 && <i className="rn-count-sep" aria-hidden="true">:</i>}
        <span className="rn-count-u" aria-hidden="true"><b key={v}>{v}</b><small>{l}</small></span>
      </Fragment>))}
    </span>
  )
}

function Chip({ tono, children }) {
  return <span className={`rn-chip is-${tono}`}>{children}</span>
}

function Vacio({ icon, titulo, texto, children }) {
  return (
    <div className="rn-empty">
      <span className="rn-empty-icon"><Icon name={icon} size={30} /></span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {children}
    </div>
  )
}

function Skeleton({ n = 3 }) {
  return <div className="rn-cards">{Array.from({ length: n }, (_, i) => <div key={i} className="rn-skel" />)}</div>
}

function textoAccion(c, r) {
  if (r?.status === 'confirmed') return { label: 'Ver mi recibo', icon: 'receipt', ok: true }
  if (r?.status === 'pending_payment') return { label: 'Completar pago', icon: 'qr', ok: true }
  if (r?.status === 'draft') return { label: 'Continuar inscripción', icon: 'arrow', ok: puedeInscribirse(c) }
  return { label: 'Inscribirme', icon: 'zap', ok: puedeInscribirse(c) }
}

// ── Carreras: material promocional + inscripcion ───────────────────────────
function TabCarreras({ carreras, porCarrera, onAccion, onPromo }) {
  if (!carreras) return <Skeleton />
  if (!carreras.length) return (<>
    <Vacio icon="flag" titulo="Pronto anunciamos nuevas carreras" texto="Volvé en unos días: acá vas a ver los afiches y abrir tu inscripción." />
    <AppPromo />
  </>)
  const futuras = carreras.filter(c => new Date(c.startsAt) > new Date())
  const destacada = futuras.find(puedeInscribirse) || futuras[0]
  const resto = carreras.filter(c => c !== destacada)

  return (<>
    {destacada && <Destacada c={destacada} r={porCarrera[destacada.id]} onAccion={onAccion} onPromo={onPromo} />}
    {resto.length > 0 && (<>
      <h2 className="rn-h2">Más carreras</h2>
      <div className="rn-cards">
        {resto.map((c, i) => <TarjetaCarrera key={c.id} c={c} r={porCarrera[c.id]} i={i} onAccion={onAccion} onPromo={onPromo} />)}
      </div>
    </>)}
    <AppPromo />
  </>)
}

function Destacada({ c, r, onAccion, onPromo }) {
  const a = textoAccion(c, r)
  const est = ESTADO_CARRERA[c.registrationStatus]
  return (
    <article className="rn-feature">
      <Arte carrera={c} proporcion={2.4} />
      <div className="rn-feature-in">
        <div className="rn-feature-tags">
          {est && <Chip tono={est.tono}>{est.label}</Chip>}
          {r && <Chip tono={ESTADO_INSCRIPCION[r.status]?.tono}>{r.status === 'confirmed' ? 'Inscrito' : ESTADO_INSCRIPCION[r.status]?.label}</Chip>}
        </div>
        {c.coverUrl && (c.logoHorizontalUrl || c.logoVerticalUrl) && <img className="rn-feature-logo" src={c.coverUrl} alt="" />}
        <h2>{c.name}</h2>
        <p className="rn-meta">
          <span><Icon name="calendar" size={16} />{fecha(c.startsAt, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <span><Icon name="clock" size={16} />{hora(c.startsAt)}</span>
          <span><Icon name="pin" size={16} />{c.city}</span>
          <span><Icon name="flag" size={16} />{km(c.distanceMeters)}</span>
        </p>
        <Countdown iso={c.startsAt} compact />
        <div className="rn-feature-cta">
          <button className="rn-btn is-accent is-lg" onClick={() => onAccion(c)} disabled={!a.ok}><Icon name={a.icon} size={20} />{a.label}</button>
          <button className="rn-btn is-light is-lg" onClick={() => onPromo(c)}><Icon name="image" size={20} />Ver afiche y detalles</button>
        </div>
        {!r && <Cupos c={c} />}
      </div>
    </article>
  )
}

function Cupos({ c }) {
  if (!c.capacity) return null
  const p = Math.min(1, (c.slotsTaken || 0) / c.capacity)
  return (
    <div className="rn-slots">
      <div className="rn-slots-bar"><span style={{ '--prog': p }} /></div>
      <small>{c.slotsAvailable > 0 ? `Quedan ${c.slotsAvailable} de ${c.capacity} cupos` : 'Sin cupos'} · desde {bs(c.priceCents, c.currency)}</small>
    </div>
  )
}

function TarjetaCarrera({ c, r, i, onAccion, onPromo }) {
  const a = textoAccion(c, r)
  const est = ESTADO_CARRERA[c.registrationStatus]
  const d = new Date(c.startsAt)
  return (
    <article className="rn-card" style={{ '--i': i }}>
      <button className="rn-card-media" onClick={() => onPromo(c)} aria-label={`Ver material de ${c.name}`}>
        <Arte carrera={c} proporcion={1.6} />
        <span className="rn-date"><b>{d.getDate()}</b>{d.toLocaleDateString('es-BO', { month: 'short' })}</span>
      </button>
      <div className="rn-card-body">
        <div className="rn-card-tags">
          {r ? <Chip tono={ESTADO_INSCRIPCION[r.status]?.tono}>{r.status === 'confirmed' ? 'Inscrito' : ESTADO_INSCRIPCION[r.status]?.label}</Chip>
            : est && <Chip tono={est.tono}>{est.label}</Chip>}
        </div>
        <h3>{c.name}</h3>
        <p className="rn-meta is-sm"><span><Icon name="pin" size={14} />{c.city}</span><span><Icon name="flag" size={14} />{km(c.distanceMeters)}</span><span><Icon name="coins" size={14} />{bs(c.priceCents, c.currency)}</span></p>
        <div className="rn-card-actions">
          <button className="rn-btn is-sm" onClick={() => onAccion(c)} disabled={!a.ok}><Icon name={a.icon} size={16} />{a.label}</button>
          <button className="rn-btn is-outline is-sm" onClick={() => onPromo(c)}>Detalles</button>
        </div>
      </div>
    </article>
  )
}

function Promo({ carrera, reg, onClose, onAccion }) {
  const [d, setD] = useState(carrera)
  useEffect(() => { getMarathon(carrera.slug || carrera.id).then(x => setD({ ...carrera, ...x })).catch(() => {}) }, [carrera.id])
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onClose])
  const a = textoAccion(d, reg)
  const incluye = Array.isArray(d.includes) ? d.includes : []
  const crono = Array.isArray(d.schedule) ? d.schedule : []
  const kit = d.kitPickup && typeof d.kitPickup === 'object' ? d.kitPickup : null
  const afiche = arte(d, 0.8)
  const material = [[d.logoVerticalUrl, 'Afiche vertical'], [d.logoHorizontalUrl, 'Afiche horizontal'], [d.coverUrl, 'Logo']].filter(([u]) => u)

  return createPortal(
    <div className="rn-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="rn-sheet is-promo" role="dialog" aria-modal="true" aria-labelledby="rn-promo-title">
        <button className="rn-close is-float" onClick={onClose} aria-label="Cerrar"><Icon name="x" /></button>
        <div className="rn-promo-grid">
          <figure className="rn-poster">
            <Arte carrera={d} proporcion={0.8} alt={`Afiche de ${d.name}`} />
            {afiche && <a className="rn-btn is-light is-sm" href={afiche} target="_blank" rel="noreferrer" download><Icon name="download" size={16} />Descargar afiche</a>}
          </figure>
          <div className="rn-promo-info">
            <span className="rn-kicker">{fecha(d.startsAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <h2 id="rn-promo-title">{d.name}</h2>
            <p className="rn-meta"><span><Icon name="clock" size={16} />{hora(d.startsAt)}</span><span><Icon name="pin" size={16} />{d.city}</span><span><Icon name="flag" size={16} />{km(d.distanceMeters)}{d.laps > 1 && ` · ${d.laps} vueltas`}</span></p>
            {d.description && <p className="rn-desc">{d.description}</p>}
            {incluye.length > 0 && (<>
              <h4 className="rn-subtitle"><Icon name="package" size={16} />Tu kit incluye</h4>
              <ul className="rn-includes">{incluye.map((x, i) => <li key={i} style={{ '--i': i }}><Icon name="check" size={14} />{String(x)}</li>)}</ul>
            </>)}
            {crono.length > 0 && (<>
              <h4 className="rn-subtitle"><Icon name="clock" size={16} />Cronograma</h4>
              <ol className="rn-timeline">{crono.map((s, i) => <li key={i}><b>{s.time}</b><div><strong>{s.title}</strong>{s.description && <small>{s.description}</small>}</div></li>)}</ol>
            </>)}
            {kit?.address && (<>
              <h4 className="rn-subtitle"><Icon name="pin" size={16} />Entrega de kits</h4>
              <p className="rn-muted">{kit.address}{kit.dates && ` · ${kit.dates}`}{kit.hours && ` · ${kit.hours}`}</p>
            </>)}
            {material.length > 0 && (<>
              <h4 className="rn-subtitle"><Icon name="image" size={16} />Material promocional</h4>
              <div className="rn-logos">{material.map(([u, t]) => <a key={u} href={u} target="_blank" rel="noreferrer" download title={`Descargar ${t.toLowerCase()}`}><img src={u} alt={t} loading="lazy" /><small>{t}</small></a>)}</div>
            </>)}
            <div className="rn-promo-cta">
              <div><small>Inscripción</small><strong>{bs(d.priceCents, d.currency)}</strong></div>
              <button className="rn-btn is-accent is-lg" disabled={!a.ok} onClick={() => onAccion(d)}><Icon name={a.icon} size={20} />{a.label}</button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Mis carreras: inscripciones, recibo y puesto ───────────────────────────
function TabInscripciones({ regs, races, carreraDe, cargando, onRecibo, onSeguir, onIr }) {
  if (cargando) return <Skeleton n={2} />
  const vivas = regs.filter(r => r.status !== 'cancelled')
  if (!vivas.length) return <Vacio icon="ticket" titulo="Todavía no te inscribiste" texto="Elegí tu próxima carrera y asegurá tu lugar."><button className="rn-btn" onClick={onIr}>Ver carreras<Icon name="arrow" size={18} /></button></Vacio>
  const resultado = Object.fromEntries(races.map(x => [x.registrationId, x]))
  const ordenadas = [...vivas].sort((a, b) => new Date(b.marathon.startsAt) - new Date(a.marathon.startsAt))

  return (
    <div className="rn-list">
      {ordenadas.map((r, i) => {
        const c = carreraDe(r.marathon.id)
        const rc = resultado[r.id]
        const res = rc?.result
        const est = ESTADO_INSCRIPCION[r.status]
        const pasada = new Date(r.marathon.startsAt) < new Date()
        return (
          <article key={r.id} className={`rn-reg is-${r.status}`} style={{ '--i': i }}>
            <div className="rn-reg-media">
              <Arte carrera={c} proporcion={1.2} />
              <span className="rn-date is-lg"><b>{new Date(r.marathon.startsAt).getDate()}</b>{new Date(r.marathon.startsAt).toLocaleDateString('es-BO', { month: 'short' })}</span>
            </div>
            <div className="rn-reg-body">
              <div className="rn-card-tags"><Chip tono={est?.tono}>{est?.label}</Chip>{rc?.categoryName && <Chip tono="neutral">{rc.categoryName}</Chip>}</div>
              <h3>{r.marathon.name}</h3>
              <p className="rn-meta is-sm"><span><Icon name="calendar" size={14} />{fecha(r.marathon.startsAt)}</span><span><Icon name="pin" size={14} />{r.marathon.city}</span><span><Icon name="flag" size={14} />{km(r.marathon.distanceMeters)}</span></p>

              {res ? (
                <div className="rn-result">
                  <div className={`rn-rank${res.overallRank <= 3 ? ` is-p${res.overallRank}` : ''}`} aria-label={res.overallRank ? `Llegaste en el puesto ${res.overallRank}${res.finishers ? ` de ${res.finishers}` : ''}` : undefined}>
                    <Icon name="trophy" size={22} />
                    <div><b>{res.overallRank ? `#${res.overallRank}` : '—'}</b><small>{res.overallRank <= 3 ? `${['¡Ganaste!', '2.º lugar', '3.º lugar'][res.overallRank - 1]}${res.finishers ? ` de ${res.finishers}` : ''}` : `puesto general${res.finishers ? ` de ${res.finishers}` : ''}`}</small></div>
                  </div>
                  {res.categoryRank && <div className="rn-rank is-alt"><div><b>#{res.categoryRank}</b><small>en tu categoría</small></div></div>}
                  <div className="rn-kv"><small>Tiempo</small><b>{duracion(res.chipTimeSeconds ?? res.finishTimeSeconds)}</b></div>
                  <div className="rn-kv"><small>Ritmo</small><b>{ritmo(res.avgPaceSecPerKm)}</b></div>
                </div>
              ) : r.status === 'confirmed' && !pasada ? (
                <div className="rn-reg-count"><span className="rn-kicker">Faltan</span><Countdown iso={r.marathon.startsAt} compact /></div>
              ) : r.status === 'confirmed' && pasada ? (
                <p className="rn-muted is-sm">Tu puesto aparece aquí cuando se publiquen los resultados.</p>
              ) : null}

              <div className="rn-card-actions">
                {r.status === 'confirmed' && <button className="rn-btn is-sm" onClick={() => onRecibo(r)}><Icon name="receipt" size={16} />Ver recibo</button>}
                {(r.status === 'pending_payment' || r.status === 'draft') && !pasada && (
                  <button className="rn-btn is-accent is-sm" onClick={() => onSeguir(r)}><Icon name={r.status === 'draft' ? 'arrow' : 'qr'} size={16} />{r.status === 'draft' ? 'Continuar inscripción' : 'Completar pago'}</button>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

// ── Entrenamientos + app ───────────────────────────────────────────────────
const TIPOS = { run: 'Carrera', walk: 'Caminata', race: 'Competencia', trail: 'Trail', treadmill: 'Cinta' }

function TabEntrenos({ token }) {
  const [h, setH] = useState(null)
  const [ws, setWs] = useState(null)
  const [sem, setSem] = useState([])
  useEffect(() => {
    getHighlights(token).then(setH).catch(() => setH({}))
    getWorkouts(token, 10).then(r => setWs(listaDe(r))).catch(() => setWs([]))
    getWorkoutWeeks(token).then(r => setSem((r?.groups || []).slice(-8))).catch(() => {})
  }, [token])
  const max = Math.max(1, ...sem.map(s => s.distanceMeters))

  return (<>
    <AppPromo />
    <div className="rn-kpis">
      <Kpi icon="activity" label="Esta semana" valor={km(h?.weekDistanceMeters)} sub={`${h?.weekWorkouts ?? 0} entrenos`} i={0} />
      <Kpi icon="trend" label="Total acumulado" valor={km(h?.totalDistanceMeters)} sub={`${h?.totalWorkouts ?? 0} entrenos`} i={1} />
      <Kpi icon="trophy" label="Más largo" valor={h?.longestWorkout ? km(h.longestWorkout.distanceMeters) : '—'} sub={h?.longestWorkout ? duracion(h.longestWorkout.durationSeconds) : 'Aún sin registro'} i={2} />
    </div>

    {sem.length > 0 && (
      <div className="rn-box">
        <h2 className="rn-h3">Kilómetros por semana</h2>
        <div className="rn-bars" role="img" aria-label={`Kilómetros de las últimas ${sem.length} semanas`}>
          {sem.map((s, i) => (
            <div key={s.startsAt} className="rn-bar" style={{ '--h': s.distanceMeters / max, '--i': i }}>
              <span className="rn-bar-val">{(s.distanceMeters / 1000).toFixed(0)}</span>
              <span className="rn-bar-fill" />
              <small>{fecha(s.startsAt, { day: 'numeric', month: 'short' })}</small>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="rn-box">
      <h2 className="rn-h3">Últimos entrenamientos</h2>
      {!ws ? <div className="rn-skel is-row" /> : !ws.length ? (
        <Vacio icon="phone" titulo="Aún no registraste entrenamientos" texto="Descargá la app CAM RUN, salí a correr y tus kilómetros aparecen acá solos." />
      ) : (
        <ul className="rn-workouts">
          {ws.map((w, i) => (
            <li key={w.id} style={{ '--i': i }}>
              <span className="rn-w-icon"><Icon name={w.type === 'race' ? 'flag' : 'activity'} size={18} /></span>
              <div className="rn-w-main"><strong>{TIPOS[w.type] || w.type}</strong><small>{fecha(w.startedAt, { weekday: 'short', day: 'numeric', month: 'short' })} · {hora(w.startedAt)}</small></div>
              <div className="rn-w-kv"><b>{km(w.distanceMeters)}</b><small>distancia</small></div>
              <div className="rn-w-kv"><b>{duracion(w.movingSeconds || w.durationSeconds)}</b><small>tiempo</small></div>
              <div className="rn-w-kv is-hide-sm"><b>{ritmo(w.avgPaceSecPerKm)}</b><small>ritmo</small></div>
              <div className="rn-w-kv is-hide-sm"><b>{Math.round(w.elevationGainMeters || 0)} m</b><small>desnivel</small></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </>)
}

function Kpi({ icon, label, valor, sub, i }) {
  return (
    <div className="rn-kpi" style={{ '--i': i }}>
      <span className="rn-kpi-icon"><Icon name={icon} size={20} /></span>
      <small>{label}</small><strong>{valor}</strong><span className="rn-muted is-sm">{sub}</span>
    </div>
  )
}

function AppPromo() {
  return (
    <section className="rn-app" aria-labelledby="rn-app-title">
      <span className="rn-app-icon" aria-hidden="true"><img src="/logo.png" alt="" /></span>
      <div className="rn-app-copy">
        <span className="rn-kicker">App CAM RUN · gratis</span>
        <h2 id="rn-app-title">Llevá CAM RUN en tu celular</h2>
        <ul>
          <li><Icon name="activity" size={16} />Entrenos con GPS</li>
          <li><Icon name="flag" size={16} />Tu tiempo oficial en vivo</li>
          <li><Icon name="trend" size={16} />Sincronizado con este panel</li>
        </ul>
      </div>
      <StoreBadges />
    </section>
  )
}

// ── Perfil: foto y contraseña ──────────────────────────────────────────────
function TabPerfil({ sesion, me, setMe, debeCambiar }) {
  const token = sesion.accessToken
  const u = me || sesion.user
  const p = me?.profile || {}
  const input = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [msg, setMsg] = useState(null)

  async function foto(file) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return setMsg({ bad: true, t: 'La foto pesa más de 5 MB.' })
    setSubiendo(true); setMsg(null)
    try {
      const { avatarUrl } = await uploadAvatar(file, token)
      setMe(m => ({ ...m, profile: { ...m?.profile, avatarUrl } }))
      setMsg({ t: 'Foto actualizada.' })
    } catch (e) { setMsg({ bad: true, t: e.message }) }
    setSubiendo(false)
  }

  async function quitar() {
    setSubiendo(true)
    try { await removeAvatar(token); setMe(m => ({ ...m, profile: { ...m?.profile, avatarUrl: null } })) } catch (e) { setMsg({ bad: true, t: e.message }) }
    setSubiendo(false)
  }

  return (
    <div className="rn-profile">
      <div className="rn-box rn-id">
        <button className="rn-avatar-edit" onClick={() => input.current?.click()} disabled={subiendo} aria-label="Cambiar foto de perfil">
          <Avatar url={p.avatarUrl} nombre={u.name || '?'} size={128} ring />
          <span className="rn-avatar-cam">{subiendo ? <span className="rn-spin" /> : <Icon name="camera" size={18} />}</span>
        </button>
        <input ref={input} type="file" accept="image/*" hidden onChange={e => { foto(e.target.files?.[0]); e.target.value = '' }} />
        <h2>{u.name}</h2>
        <p className="rn-muted">{u.email || 'Sin correo'}</p>
        {msg && <p className={msg.bad ? 'rn-error' : 'rn-ok'} role="status">{msg.t}</p>}
        <div className="rn-card-actions is-center">
          <button className="rn-btn is-sm" onClick={() => input.current?.click()} disabled={subiendo}><Icon name="upload" size={16} />Subir foto</button>
          {p.avatarUrl && <button className="rn-btn is-outline is-sm" onClick={quitar} disabled={subiendo}><Icon name="trash" size={16} />Quitar</button>}
        </div>
        {me?.createdAt && <p className="rn-muted is-sm">Miembro desde {fecha(me.createdAt, { month: 'long', year: 'numeric' })}</p>}
      </div>
      <div className="rn-stack">
        {me && <DatosPersonales me={me} token={token} onGuardado={setMe} />}
        <CambiarClave token={token} obligatoria={debeCambiar} onCambiada={() => setMe(m => m && { ...m, mustChangePassword: false })} />
      </div>
    </div>
  )
}

const GENEROS = [['female', 'Mujer'], ['male', 'Hombre'], ['other', 'Otro'], ['unspecified', 'Prefiero no decir']]

function desdeMe(me) {
  const p = me.profile || {}
  return {
    name: me.name || '', email: me.email || '', ci: me.ci || '', phone: p.phone || '', city: p.city || '',
    birthDate: p.birthDate ? p.birthDate.slice(0, 10) : '', gender: p.gender || 'unspecified',
    peso: p.weightGrams ? String(p.weightGrams / 1000) : '', heightCm: p.heightCm ? String(p.heightCm) : '',
  }
}

// PATCH /users/me solo con lo que cambio: tocar el email lo deja sin verificar
function DatosPersonales({ me, token, onGuardado }) {
  const base = useMemo(() => desdeMe(me), [me])
  const [f, setF] = useState(base)
  const [estado, setEstado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  useEffect(() => setF(base), [base])
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const cambios = Object.keys(f).filter(k => f[k] !== base[k])

  async function submit(e) {
    e.preventDefault()
    const nulo = v => (v.trim() === '' ? null : v.trim())
    const cuerpo = {}
    for (const k of cambios) {
      if (k === 'peso') cuerpo.weightGrams = f.peso ? Math.round(Number(f.peso) * 1000) : null
      else if (k === 'heightCm') cuerpo.heightCm = f.heightCm ? Number(f.heightCm) : null
      else if (['phone', 'city', 'birthDate'].includes(k)) cuerpo[k] = nulo(f[k])
      else cuerpo[k] = f[k].trim()
    }
    setEnviando(true); setEstado(null)
    try {
      onGuardado(await updateMe(cuerpo, token))
      setEstado({ t: cuerpo.email ? 'Datos guardados. Revisá tu correo nuevo para verificarlo.' : 'Datos guardados.' })
    } catch (err) { setEstado({ bad: true, t: err.message }) }
    setEnviando(false)
  }

  return (
    <form className="rn-box rn-form" onSubmit={submit}>
      <h2 className="rn-h3"><Icon name="user" size={20} />Datos personales</h2>
      <div className="rn-grid2">
        <label className="rn-field is-full"><span className="rn-field-label">Nombre completo</span>
          <input required maxLength={120} value={f.name} onChange={set('name')} autoComplete="name" /></label>
        <label className="rn-field"><span className="rn-field-label">Carnet de identidad</span>
          <input required maxLength={40} value={f.ci} onChange={set('ci')} /></label>
        <label className="rn-field"><span className="rn-field-label">Celular</span>
          <input type="tel" maxLength={40} value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="+591 70000000" /></label>
        <label className="rn-field is-full"><span className="rn-field-label">Correo</span>
          <input type="email" maxLength={254} value={f.email} onChange={set('email')} autoComplete="email" />
          {f.email !== base.email && <small>Al cambiarlo tendrás que verificar el correo nuevo.</small>}</label>
        <label className="rn-field"><span className="rn-field-label">Ciudad</span>
          <input maxLength={120} value={f.city} onChange={set('city')} autoComplete="address-level2" /></label>
        <label className="rn-field"><span className="rn-field-label">Fecha de nacimiento</span>
          <input type="date" value={f.birthDate} onChange={set('birthDate')} max={new Date().toISOString().slice(0, 10)} /></label>
        <label className="rn-field"><span className="rn-field-label">Género</span>
          <select value={f.gender} onChange={set('gender')}>{GENEROS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
        <div className="rn-grid2 is-tight">
          <label className="rn-field"><span className="rn-field-label">Peso (kg)</span>
            <input type="number" inputMode="decimal" min="20" max="400" step="0.1" value={f.peso} onChange={set('peso')} /></label>
          <label className="rn-field"><span className="rn-field-label">Altura (cm)</span>
            <input type="number" inputMode="numeric" min="80" max="260" value={f.heightCm} onChange={set('heightCm')} /></label>
        </div>
      </div>
      {estado && <p className={estado.bad ? 'rn-error' : 'rn-ok'} role="status">{estado.t}</p>}
      <div className="rn-form-foot">
        {cambios.length > 0 && <button type="button" className="rn-btn is-outline" onClick={() => setF(base)}>Descartar</button>}
        <button className="rn-btn" disabled={!cambios.length || enviando}>{enviando ? <span className="rn-spin" /> : <Icon name="check" size={18} />}Guardar cambios</button>
      </div>
    </form>
  )
}

const REGLAS = [
  ['8 caracteres o más', v => v.length >= 8],
  ['Al menos una letra', v => /[A-Za-z]/.test(v)],
  ['Al menos un número', v => /\d/.test(v)],
]

function CambiarClave({ token, obligatoria, onCambiada }) {
  const [f, setF] = useState({ actual: '', nueva: '', repetir: '' })
  const [ver, setVer] = useState(false)
  const [estado, setEstado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const ok = REGLAS.every(([, t]) => t(f.nueva))
  const coincide = f.nueva && f.nueva === f.repetir
  const set = k => e => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    if (!ok || !coincide) return
    setEnviando(true); setEstado(null)
    try {
      await changePassword(f.actual, f.nueva, token)
      setF({ actual: '', nueva: '', repetir: '' })
      setEstado({ t: 'Listo: tu contraseña cambió y cerramos tus otras sesiones.' })
      onCambiada()
      try {
        const s = JSON.parse(localStorage.getItem('auth.sesion'))
        if (s?.user) localStorage.setItem('auth.sesion', JSON.stringify({ ...s, user: { ...s.user, mustChangePassword: false } }))
      } catch {}
    } catch (err) { setEstado({ bad: true, t: err.message }) }
    setEnviando(false)
  }

  return (
    <form className="rn-box rn-form" onSubmit={submit}>
      <h2 className="rn-h3"><Icon name="lock" size={20} />Cambiar contraseña</h2>
      {obligatoria && <p className="rn-note"><Icon name="info" size={16} />Tu cuenta se creó con tu carnet como contraseña. Elegí una nueva.</p>}
      <label className="rn-field"><span className="rn-field-label">Contraseña actual</span>
        <input type={ver ? 'text' : 'password'} required value={f.actual} onChange={set('actual')} autoComplete="current-password" /></label>
      <label className="rn-field"><span className="rn-field-label">Nueva contraseña</span>
        <div className="rn-pass">
          <input type={ver ? 'text' : 'password'} required value={f.nueva} onChange={set('nueva')} autoComplete="new-password" aria-describedby="rn-reglas" />
          <button type="button" className="rn-icon-btn" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}><Icon name={ver ? 'eyeOff' : 'eye'} size={18} /></button>
        </div>
      </label>
      <ul className="rn-rules" id="rn-reglas">
        {REGLAS.map(([t, fn]) => <li key={t} className={fn(f.nueva) ? 'is-ok' : ''}><Icon name="check" size={14} />{t}</li>)}
      </ul>
      <label className="rn-field"><span className="rn-field-label">Repetir nueva contraseña</span>
        <input type={ver ? 'text' : 'password'} required value={f.repetir} onChange={set('repetir')} autoComplete="new-password" aria-invalid={f.repetir && !coincide ? 'true' : undefined} />
        {f.repetir && !coincide && <small className="rn-field-err">No coincide con la nueva.</small>}
      </label>
      {estado && <p className={estado.bad ? 'rn-error' : 'rn-ok'} role="status">{estado.t}</p>}
      <button className="rn-btn" disabled={!ok || !coincide || !f.actual || enviando}>{enviando ? <span className="rn-spin" /> : <Icon name="key" size={18} />}Guardar contraseña</button>
    </form>
  )
}
