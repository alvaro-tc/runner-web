import { useEffect, useState } from 'react'
import { APK_URL } from './api'
import './landing.css'

// Hora de largada asumida (07:00, hora de Bolivia). Ajustar cuando se confirme.
const LARGADA = new Date('2026-11-22T07:00:00-04:00')
const WHATSAPP = 'https://wa.me/59170868610'
const FACEBOOK = 'https://www.facebook.com/CAM.BO.LP'

// TODO: confirmar precios con el CAM antes de publicar.
const DISTANCIAS = [
  { km: 42, nombre: 'Maratón', texto: 'La distancia completa. Para quienes ya tienen kilómetros en las piernas y quieren el reto entero.', precio: 150 },
  { km: 21, nombre: 'Media maratón', texto: 'Exigente pero alcanzable con unas semanas de preparación constante.', precio: 120 },
  { km: 10, nombre: 'Diez kilómetros', texto: 'Para estrenarte en una carrera o correrla en familia y con amigas.', precio: 80 },
]

const LEMAS = ['Alistá los tenis', 'Guardá la fecha', 'Corré por la vida', 'Corremos por una buena causa']

const dos = n => String(n).padStart(2, '0')

function useCuentaRegresiva() {
  const [ahora, setAhora] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const ms = Math.max(0, LARGADA - ahora)
  return {
    dias: Math.floor(ms / 864e5),
    horas: Math.floor(ms / 36e5) % 24,
    min: Math.floor(ms / 6e4) % 60,
    seg: Math.floor(ms / 1e3) % 60,
    llego: ms === 0,
  }
}

function Dorsal() {
  const { dias, horas, min, seg, llego } = useCuentaRegresiva()
  return (
    <div className="lp-bib-wrap">
      <div className="lp-bib" role="timer" aria-label={llego ? 'La carrera ya largó' : `Faltan ${dias} días para la carrera`}>
        <span className="lp-pin" /><span className="lp-pin" /><span className="lp-pin" /><span className="lp-pin" />
        <div className="lp-bib-top">
          <span>CAM RUN</span>
          <span>22 nov 2026</span>
        </div>
        {llego ? (
          <p className="lp-bib-hoy">¡Hoy corremos!</p>
        ) : (
          <>
            <div className="lp-bib-num">{dias}</div>
            <p className="lp-bib-label">{dias === 1 ? 'día' : 'días'} para la largada</p>
            <p className="lp-bib-clock" aria-hidden="true">
              <b>{dos(horas)}</b><small>h</small>
              <b>{dos(min)}</b><small>min</small>
              <b key={seg} className="lp-tick">{dos(seg)}</b><small>s</small>
            </p>
          </>
        )}
        <p className="lp-bib-foot">San Miguel, La Paz</p>
      </div>
    </div>
  )
}

export default function Landing({ onAcceso, onRegistro }) {
  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-text">
            <h1 className="lp-h1">
              <span>Alistá</span>
              <span>los tenis.</span>
              <span className="lp-h1-small">Corremos por una buena causa.</span>
            </h1>
            <p className="lp-hero-lead">
              CAM RUN es una carrera solidaria: todo lo recaudado sostiene la atención a mujeres bolivianas en crisis.
              Domingo 22 de noviembre en San Miguel.
            </p>
            <div className="lp-hero-actions">
              <button className="lp-btn lp-btn-sol" onClick={onRegistro}>Inscribirme</button>
              <a className="lp-link" href="#distancias">Ver distancias</a>
            </div>
          </div>
          <Dorsal />
        </div>
      </section>

      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {[...LEMAS, ...LEMAS, ...LEMAS, ...LEMAS].map((l, i) => (
            <span key={i}>{l}<i /></span>
          ))}
        </div>
      </div>

      <section className="lp-sec lp-dist" id="distancias">
        <div className="lp-wrap">
          <h2 className="lp-h2">Elegí tu distancia</h2>
          <p className="lp-intro">Tres recorridos, una misma causa. Cada barra muestra el largo real de cada carrera.</p>
          <ol className="lp-dist-list">
            {DISTANCIAS.map(d => (
              <li key={d.km} className="lp-dist-row" style={{ '--largo': d.km / 42 }}>
                <span className="lp-dist-num">{d.km}<small>K</small></span>
                <div className="lp-dist-body">
                  <span className="lp-dist-bar" />
                  <h3>{d.nombre}</h3>
                  <p>{d.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-sec lp-route" id="recorrido">
        <div className="lp-wrap lp-route-grid">
          <div>
            <h2 className="lp-h2">El recorrido</h2>
            <p className="lp-intro">
              Salida y meta en San Miguel, zona Sur de La Paz. Las tres distancias comparten la largada y se separan según los kilómetros de cada una.
            </p>
            <p className="lp-note">Trazado referencial. El mapa oficial se publica antes de la carrera.</p>
          </div>
          <figure className="lp-map">
            <svg viewBox="0 0 600 400" role="img" aria-label="Mapa referencial del recorrido con salida y meta en San Miguel">
              <defs>
                <pattern id="calles" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
                  <path d="M0 0H40M0 0V40" className="lp-map-grid" />
                </pattern>
              </defs>
              <rect width="600" height="400" fill="url(#calles)" />
              <path className="lp-map-base" d="M90 330 L90 210 Q90 180 120 172 L250 136 Q280 128 292 100 L312 52 Q322 30 346 34 L470 56 Q505 62 510 96 L522 250 Q525 290 488 300 L300 342 Q270 349 240 340 L120 332 Q96 331 90 330" />
              <path className="lp-map-line" pathLength="1" d="M90 330 L90 210 Q90 180 120 172 L250 136 Q280 128 292 100 L312 52 Q322 30 346 34 L470 56 Q505 62 510 96 L522 250 Q525 290 488 300 L300 342 Q270 349 240 340 L120 332 Q96 331 90 330" />
              <g className="lp-map-pin">
                <path d="M90 330 L68 292 A25 25 0 1 1 112 292 Z" />
                <circle cx="90" cy="280" r="9" />
              </g>
              <text x="122" y="300" className="lp-map-label">Salida y meta</text>
            </svg>
          </figure>
        </div>
      </section>

      <section className="lp-sec lp-price" id="precios">
        <div className="lp-wrap">
          <h2 className="lp-h2">Precios</h2>
          <p className="lp-intro">El 100% de tu inscripción va al Centro de Apoyo a la Mujer.</p>
          <ul className="lp-price-list">
            {DISTANCIAS.map(d => (
              <li key={d.km}>
                <span className="lp-price-km">{d.km}K</span>
                <span className="lp-price-name">{d.nombre}</span>
                <span className="lp-price-bs"><small>Bs</small>{d.precio}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lp-sec lp-join" id="inscripcion">
        <div className="lp-wrap lp-join-grid">
          <div>
            <h2 className="lp-h2">Inscribite en tres pasos</h2>
            <ol className="lp-steps">
              <li><b>Creá tu cuenta</b> con tu correo en esta página o en la app.</li>
              <li><b>Elegí tu distancia</b> y pagá con el QR que te mostramos.</li>
              <li><b>Subí tu comprobante.</b> Cuando lo validemos, tu inscripción queda confirmada.</li>
            </ol>
            <div className="lp-hero-actions">
              <button className="lp-btn lp-btn-sol" onClick={onRegistro}>Crear cuenta e inscribirme</button>
              <button className="lp-link" onClick={onAcceso}>Ya tengo cuenta</button>
            </div>
            <p className="lp-help">¿Dudas? Escribinos por <a href={WHATSAPP} target="_blank" rel="noreferrer">WhatsApp al 70868610</a>.</p>
          </div>
          <aside className="lp-cause">
            <h3>A quién ayudás</h3>
            <p>Mujeres bolivianas en crisis que llegan al CAM. Tu inscripción financia:</p>
            <ul>
              <li>Acompañamiento y apoyo integral</li>
              <li>Atención psicológica</li>
              <li>Derivación a distintos profesionales</li>
            </ul>
            <p className="lp-cause-close">Cada paso ayuda a reconstruir vidas.</p>
            <div className="lp-app">
              <img src="/app-qr.svg" alt="Código QR para descargar la app de Android" width="96" height="96" />
              <div>
                <p>También podés inscribirte desde la app.</p>
                <a className="lp-link" href={APK_URL}>Descargar app para Android</a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-grid">
          <div className="lp-foot-brand">
            <img src="/logo.png" alt="" width="40" height="40" />
            <p><b>CAM RUN</b><br />Centro de Apoyo a la Mujer</p>
          </div>
          <nav aria-label="Redes y contacto">
            <a href={FACEBOOK} target="_blank" rel="noreferrer">Facebook</a>
            <a href={WHATSAPP} target="_blank" rel="noreferrer">WhatsApp</a>
            <a href="/privacidad">Privacidad</a>
            <a href="/terminos">Términos</a>
          </nav>
          <p className="lp-foot-copy">© 2026 Centro de Apoyo a la Mujer</p>
        </div>
      </footer>
    </div>
  )
}
