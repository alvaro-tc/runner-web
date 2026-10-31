import { useEffect, useMemo, useRef, useState } from 'react'
import { getMarathon, getMarathons } from './api'

const km = m => `${(m / 1000).toLocaleString('es-BO', { maximumFractionDigits: 2 })} km`
const bs = (cents, moneda) => cents ? `${moneda === 'BOB' ? 'Bs' : moneda} ${(cents / 100).toLocaleString('es-BO')}` : 'Gratis'

function coordenadas(geo) {
  const pts = geo?.type === 'LineString' ? geo.coordinates : geo?.features?.[0]?.geometry?.coordinates
  return pts?.length ? pts.map(([lng, lat]) => [lat, lng]) : null
}

// Leaflet se carga recién al abrir el mapa: la landing no paga ese peso
function MapaRecorrido({ puntos, previa }) {
  const ref = useRef(null)
  useEffect(() => {
    let mapa, obs, espera, encuadrar
    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(([{ default: L }]) => {
      if (!ref.current) return
      const fijos = { zoomSnap: 0.1, zoomControl: false, scrollWheelZoom: false }
      mapa = L.map(ref.current, previa
        ? { ...fijos, dragging: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false, attributionControl: false }
        : fijos)
      if (!previa) L.control.zoom({ position: 'bottomright' }).addTo(mapa)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapa)
      L.polyline(puntos, { color: '#8B5CF6', weight: 12, opacity: 0.2 }).addTo(mapa)
      const linea = L.polyline(puntos, { color: '#7C3AED', weight: 4, className: 'r-anim' }).addTo(mapa)
      linea.getElement()?.setAttribute('pathLength', '1')
      L.circleMarker(puntos[0], { radius: 7, color: '#fff', weight: 3, fillColor: '#7C3AED', fillOpacity: 1 })
        .addTo(mapa).bindTooltip('Largada y meta', { permanent: !previa, direction: 'top', offset: [0, -10], className: 'r-tip' })
      // El modal abre con una animación de escala: se vuelve a medir y encuadrar cuando termina o cambia el tamaño
      encuadrar = () => { mapa.invalidateSize(); mapa.fitBounds(linea.getBounds(), { padding: previa ? [24, 24] : [60, 60] }) }
      encuadrar()
      espera = setTimeout(encuadrar, 450)
      obs = new ResizeObserver(() => encuadrar())
      obs.observe(ref.current)
    })
    return () => { clearTimeout(espera); obs?.disconnect(); mapa?.remove() }
  }, [puntos, previa])
  return <div ref={ref} className={previa ? 'race-map race-map-sm' : 'race-map'} />
}

// Mapa grande en su propio modal; se monta al abrir para que Leaflet mida bien el contenedor
function ModalMapa({ abierto, onCerrar, puntos, titulo }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])
  return (
    <dialog ref={ref} className="race-map-modal" onClose={onCerrar} onClick={e => e.target === ref.current && onCerrar()} aria-label={titulo}>
      <button className="lp-race-x" onClick={onCerrar} aria-label="Cerrar mapa">×</button>
      {abierto && <MapaRecorrido puntos={puntos} />}
    </dialog>
  )
}

// Ícono de trazo fino según lo que nombra el ítem; lo que no reconoce lleva un regalo
const ICONOS = [
  [/medall/i, <><circle cx="12" cy="15" r="6" /><path d="M8.5 10.2 6 3h4l2 4.5L14 3h4l-2.5 7.2" /></>],
  [/dorsal|n[uú]mero/i, <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M8 12h8M10 15.5h4" /><circle cx="7" cy="8.5" r=".6" /><circle cx="17" cy="8.5" r=".6" /></>],
  [/bebida|agua|hidrat|refresc/i, <><path d="M6.5 3h11l-1.4 16.2a2 2 0 0 1-2 1.8H9.9a2 2 0 0 1-2-1.8z" /><path d="M7.2 9h9.6" /></>],
  [/remera|polera|camiseta|polo/i, <path d="M9 3 4 5.5 2.5 10l3.5 1V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9l3.5-1L20 5.5 15 3a3 3 0 0 1-6 0Z" />],
  [/virtual/i, <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M11 18h2" /></>],
  [/modalidad|\bk\b|km|\dk/i, <><circle cx="6" cy="18.5" r="2.5" /><circle cx="18" cy="5.5" r="2.5" /><path d="M8.5 18.5H16a3.25 3.25 0 0 0 0-6.5H8a3.25 3.25 0 0 1 0-6.5h7.5" /></>],
]
const REGALO = <><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M12 8v13M18.5 12v7a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-7" /><path d="M12 8S10.5 3.5 8 3.5a2.25 2.25 0 0 0 0 4.5M12 8s1.5-4.5 4-4.5a2.25 2.25 0 0 1 0 4.5" /></>
const icono = texto => ICONOS.find(([re]) => re.test(texto))?.[1] || REGALO

function enCalendario(m) {
  const f = d => d.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const ini = new Date(m.startsAt)
  const p = new URLSearchParams({ action: 'TEMPLATE', text: m.name, dates: `${f(ini)}/${f(new Date(+ini + 2 * 36e5))}`, details: m.description || '', location: m.city })
  return `https://calendar.google.com/calendar/render?${p}`
}

export default function CarreraDetalle({ abierto, onCerrar, onInscribirme }) {
  const ref = useRef(null)
  const [m, setM] = useState(null)
  const [error, setError] = useState('')
  const [mapaGrande, setMapaGrande] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  useEffect(() => {
    if (!abierto || m) return
    setError('')
    getMarathons()
      .then(lista => lista[0] ? getMarathon(lista[0].slug) : Promise.reject(new Error('Todavía no hay carreras publicadas.')))
      .then(setM, e => setError(e.message))
  }, [abierto, m])

  const fecha = m && new Date(m.startsAt)
  const zona = m?.timezone || 'America/La_Paz'
  const fmt = opts => fecha.toLocaleString('es-BO', { ...opts, timeZone: zona })
  const ruta = useMemo(() => m && coordenadas(m.routeGeoJson), [m])
  const ocupado = m ? Math.min(100, Math.round((m.slotsTaken / m.capacity) * 100)) : 0
  const dias = m ? Math.max(0, Math.ceil((fecha - Date.now()) / 864e5)) : 0
  const incluye = Array.isArray(m?.includes) ? m.includes : []
  const cronograma = Array.isArray(m?.schedule) ? m.schedule : []

  return (
    <dialog ref={ref} className="lp-race" onClose={onCerrar} onClick={e => e.target === ref.current && onCerrar()} aria-label="Detalles de la carrera">
      <button className="lp-race-x" onClick={onCerrar} aria-label="Cerrar">×</button>

      {!m ? (
        <div className="lp-race-load">{error ? <p>{error}</p> : <><i /><p>Cargando la carrera…</p></>}</div>
      ) : (
        <>
          <header className="race-hero">
            {(m.logoHorizontalUrl || m.coverUrl) && <img className="race-hero-bg" src={m.logoHorizontalUrl || m.coverUrl} alt={`Logo de ${m.name}`} />}
            {m.registrationStatus === 'open' && <p className="status-pill"><i />Inscripciones abiertas</p>}
            <h2>{m.name}</h2>
            <p className="race-when">
              <b>{fmt({ weekday: 'long', day: 'numeric', month: 'long' })}</b>
              <span>{fmt({ hour: '2-digit', minute: '2-digit', hour12: false })} · {m.city}</span>
            </p>
          </header>

          <div className="race-body">
            <ul className="race-stats">
              <li><small>Distancia</small><b>{km(m.distanceMeters)}</b>{m.laps > 1 && <span>{m.laps} vueltas de {km(m.lapDistanceMeters)}</span>}</li>
              <li><small>Inscripción</small><b>{bs(m.priceCents, m.currency)}</b><span>por corredor</span></li>
              <li className="race-cupos">
                <small>Cupos</small><b>{m.slotsAvailable}</b><span>libres de {m.capacity}</span>
                <div className="race-bar" role="progressbar" aria-valuenow={ocupado} aria-valuemin="0" aria-valuemax="100" aria-label="Cupos ocupados"><i style={{ width: `${Math.max(ocupado, 2)}%` }} /></div>
              </li>
            </ul>

            <div className="race-grid">
              <section className="race-card race-about">
                {m.logoVerticalUrl && <img className="race-logo-v" src={m.logoVerticalUrl} alt="" />}
                <div>
                  <h3>La carrera</h3>
                  {m.description && <p>{m.description}</p>}
                  {m.categories?.length > 0 && (
                    <ul className="race-cats">
                      {m.categories.map(c => <li key={c.id}>{c.name}{c.extraPriceCents > 0 && <small>+{bs(c.extraPriceCents, m.currency)}</small>}</li>)}
                    </ul>
                  )}
                </div>
              </section>

              {ruta && (
                <section className="race-card race-route">
                  <div className="race-route-head">
                    <h3>El recorrido</h3>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${ruta[0][0]},${ruta[0][1]}`} target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a>
                  </div>
                  <button className="race-map-btn" onClick={() => setMapaGrande(true)} aria-label="Ampliar el mapa del recorrido">
                    <MapaRecorrido puntos={ruta} previa />
                    <span>Ampliar mapa</span>
                  </button>
                  <ul className="race-route-chips">
                    <li><b>{km(m.lapDistanceMeters)}</b>{m.laps > 1 ? 'por vuelta' : 'recorrido'}</li>
                    {m.laps > 1 && <li><b>× {m.laps}</b>vueltas</li>}
                    <li><b>{km(m.distanceMeters)}</b>en total</li>
                  </ul>
                </section>
              )}

              {cronograma.length > 0 && (
                <section className="race-card race-sched">
                  <div className="race-day">
                    <div className="race-cal"><small>{fmt({ month: 'short' }).replace('.', '')}</small><b>{fmt({ day: 'numeric' })}</b><small>{fmt({ weekday: 'short' }).replace('.', '')}</small></div>
                    <div>
                      <h3>Cronograma</h3>
                      <p>{dias > 0 ? <>Faltan <b>{dias} {dias === 1 ? 'día' : 'días'}</b> para la largada</> : '¡Es hoy!'}</p>
                    </div>
                  </div>
                  <ol>
                    {cronograma.map((s, i) => (
                      <li key={i} style={{ '--i': i }}>
                        <time>{s.time}</time>
                        <div><b>{s.title}</b>{(s.detail || s.description) && <span>{s.detail || s.description}</span>}</div>
                      </li>
                    ))}
                  </ol>
                  <div className="race-sched-foot">
                    <p>Llegá con tiempo para retirar tu dorsal y calentar antes de la largada.</p>
                    <a className="race-cal-btn" href={enCalendario(m)} target="_blank" rel="noopener noreferrer">Agregar a mi calendario</a>
                  </div>
                </section>
              )}

              {incluye.length > 0 && (
                <section className="race-card race-inc">
                  <div className="race-inc-head">
                    <h3>Tu inscripción incluye</h3>
                    <p>Todo esto viene con tu inscripción de {bs(m.priceCents, m.currency)}</p>
                  </div>
                  <ul>
                    {incluye.map((x, i) => (
                      <li key={x} style={{ '--i': i }}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">{icono(x)}</svg>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {m.extras?.length > 0 && (
                <section className="race-card race-inc">
                  <div className="race-inc-head"><h3>Extras</h3><p>Sumalos al inscribirte</p></div>
                  <ul>{m.extras.map((x, i) => <li key={x.id} style={{ '--i': i }}><svg viewBox="0 0 24 24" aria-hidden="true">{icono(x.name)}</svg><span>{x.name}<small>{bs(x.priceCents, m.currency)}</small></span></li>)}</ul>
                </section>
              )}

              {m.kitPickup?.address && (
                <section className="race-card">
                  <h3>Retiro de kit</h3>
                  <p>{m.kitPickup.address}</p>
                </section>
              )}
            </div>
          </div>

          {ruta && <ModalMapa abierto={mapaGrande} onCerrar={() => setMapaGrande(false)} puntos={ruta} titulo={`Recorrido de ${m.name}`} />}

          <footer className="race-cta">
            <div><b>{bs(m.priceCents, m.currency)}</b><small>{m.slotsAvailable} cupos libres</small></div>
            <button className="btn btn-main" onClick={onInscribirme}>Inscribirme</button>
          </footer>
        </>
      )}
    </dialog>
  )
}
