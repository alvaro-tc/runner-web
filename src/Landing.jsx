import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './landing.css'

const LARGADA = new Date('2026-11-22T08:00:00-04:00')
const WHATSAPP = 'https://wa.me/59170868610'
const WHATSAPP_INFO = `${WHATSAPP}?text=${encodeURIComponent('Hola, quiero info de CAM RUN 5K')}`
const FACEBOOK = 'https://www.facebook.com/CAM.BO.LP'
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.tumype.camrun&pcampaignid=web_share'
const APPSTORE_URL = 'https://apps.apple.com/bo/app/camrun/id6818321729'
// TODO: enlace real de Instagram cuando exista.
const INSTAGRAM = '#'

const LEMAS = ['¡Alistá los tenis, corremos por una buena causa!', 'Guardá la fecha', 'Corré por la vida', '22 de noviembre en San Miguel', 'Cada paso ayuda a reconstruir vidas']

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

// Foto principal con la fecha y la causa como tarjetas encima
function HeroFoto() {
  return (
    <div className="hero-photo">
      <figure>
        <img src="/landing/hero.jpg" alt="Una mamá y su hija corriendo juntas en una carrera de mujeres" width="960" height="1200" fetchPriority="high" />
      </figure>
      <div className="tag tag-date">
        <small>Domingo</small><b>22 nov</b><small>08:00, Av. Montenegro</small>
      </div>
      <div className="tag tag-cause">Corremos por ellas</div>
      <div className="tag tag-km"><b>5K</b><small>y 1.5K familiar</small></div>
    </div>
  )
}

function Cuenta() {
  const { dias, horas, min, seg } = useCuentaRegresiva()
  return (
    <div className="count">
      <div className="wrap" role="timer" aria-label={`Faltan ${dias} días para la carrera`}>
        <p><b>Domingo 22 de noviembre, 08:00</b>Av. Montenegro, San Miguel</p>
        <div className="cell"><strong>{dias}</strong><small>días</small></div>
        <div className="cell"><strong>{dos(horas)}</strong><small>horas</small></div>
        <div className="cell"><strong>{dos(min)}</strong><small>minutos</small></div>
        <div className="cell"><strong>{dos(seg)}</strong><small>segundos</small></div>
      </div>
    </div>
  )
}

function MiniDias() {
  const { dias, llego } = useCuentaRegresiva()
  return <span>{llego ? '¡Hoy!' : `${dias} días`}</span>
}

const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00D9FF" d="M3.6 2.3 13.4 12l-9.8 9.7A1.5 1.5 0 0 1 3 20.5v-17a1.5 1.5 0 0 1 .6-1.2Z" /><path fill="#00F076" d="m16.8 8.6-3.4 3.4-9.8-9.7c.4-.3 1-.3 1.5 0l11.7 6.3Z" /><path fill="#FF3A5E" d="M16.8 15.4 5.1 21.7c-.5.3-1.1.3-1.5 0l9.8-9.7 3.4 3.4Z" /><path fill="#FFC72C" d="m20.4 13.3-3.6 2.1-3.4-3.4 3.4-3.4 3.6 2a1.5 1.5 0 0 1 0 2.7Z" /></svg>
)
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7a4.5 4.5 0 0 0-3.5-1.9c-1.5-.2-2.9.9-3.7.9s-1.9-.9-3.2-.8A4.7 4.7 0 0 0 4.2 9.5c-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4s1.7-.8 3.1-.8 1.9.8 3.2.8 2.1-1.2 2.9-2.4a10 10 0 0 0 1.3-2.7 4.2 4.2 0 0 1-2.5-3.9ZM14 5.4A4.3 4.3 0 0 0 15 2.3a4.4 4.4 0 0 0-2.9 1.5 4.1 4.1 0 0 0-1 3 3.6 3.6 0 0 0 2.9-1.4Z" /></svg>
)

// Insignia de tienda al estilo de los badges oficiales (icono + "Disponible en / Nombre")
function StoreBadge({ href, icon, eyebrow, name }) {
  return (
    <a className="store-badge" href={href} target="_blank" rel="noopener noreferrer">
      {icon}
      <span><small>{eyebrow}</small><strong>{name}</strong></span>
    </a>
  )
}

// Aviso del hero: la app ya está disponible para descargar
function HeroApps() {
  return (
    <div className="hero-apps">
      <p>Llevá CAM RUN en el celular</p>
      <div className="store-badges">
        <StoreBadge href={PLAY_URL} icon={<GooglePlayIcon />} eyebrow="Disponible en" name="Google Play" />
        <StoreBadge href={APPSTORE_URL} icon={<AppleIcon />} eyebrow="Descárgala en" name="App Store" />
      </div>
    </div>
  )
}

// Pasos de inscripción: se muestran al tocar cualquier "Inscribirme"
export function PasosInscripcion({ abierto, onCerrar, onRegistro, onAcceso }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])
  return (
    <dialog ref={ref} className="lp-steps" onClose={onCerrar} onClick={e => e.target === ref.current && onCerrar()}>
      <div className="lp-steps-box">
        <button className="lp-steps-x" onClick={onCerrar} aria-label="Cerrar">×</button>
        <h2>Inscribite en 4 pasos</h2>
        <p className="lp-steps-lead">Te lleva un par de minutos. Si tenés dudas, escribinos al <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp 70868610</a>.</p>
        <ol>
          <li><b>1</b><div><h3>Creá tu cuenta</h3><p>Con tu correo, acá mismo o en la app.</p></div></li>
          <li><b>2</b><div><h3>Elegí y pagá</h3><p>Elegí tu distancia y pagá con el QR que te mostramos.</p></div></li>
          <li><b>3</b><div><h3>Subí tu comprobante</h3><p>Cuando lo validemos, tu inscripción queda confirmada.</p></div></li>
          <li><b>4</b><div><h3>Corré el 22</h3><p>Domingo 22 de noviembre, 08:00, Av. Montenegro, San Miguel.</p></div></li>
        </ol>
        <div className="lp-steps-actions">
          <button className="btn btn-main" onClick={onRegistro}>Crear cuenta e inscribirme</button>
          <button className="lp-inline" onClick={onAcceso}>Ya tengo cuenta</button>
        </div>
      </div>
    </dialog>
  )
}

const Wa = () => <svg><use href="#i-wa" /></svg>

export default function Landing({ onInscribirme }) {
  return (
    <div className="lp">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <symbol id="i-wa" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" /></symbol>
      </svg>

      <section className="hero" style={{ paddingBottom: 0 }}>
        <img className="hero-sky" src="/landing/lapaz-banda.jpg" alt="" aria-hidden="true" />
        <div className="wrap hero-grid">
          <div>
            <p className="status-pill"><i />Inscripciones abiertas</p>
            <h1>Alistá los tenis.<span>Guardá la fecha.<br />Corré por la vida.</span></h1>
            <p className="lead">Social Run benéfica de 5 km, y 1.5 km para chicos y familias. Domingo 22 de noviembre a las 08:00, Av. Montenegro, San Miguel. Todo lo recaudado acompaña a mujeres bolivianas en crisis a través del CAM.</p>
            <div className="cta-row">
              <button className="btn btn-main" onClick={onInscribirme}>Inscribirme</button>
              <a className="btn btn-line" href="#causa">Conocer la causa</a>
            </div>
            <HeroApps />
            <ul className="dist-pills">
              <li><b>5 km</b>Social Run</li>
              <li><b>1.5 km</b>Chicos y familias</li>
              <li><b>100%</b>al CAM</li>
            </ul>
          </div>
          <HeroFoto />
        </div>
        <Cuenta />
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[0, 1].map(k => (
              <span key={k}>
                {LEMAS.map(l => <span key={l}>{l}<i /></span>)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="day" id="el-dia">
        <div className="wrap day-grid">
          <a className="poster" href="/landing/afiche.jpg" target="_blank" rel="noopener noreferrer">
            <img src="/landing/afiche.jpg" alt="Afiche oficial de CAM RUN: domingo 22 de noviembre de 2026, 08:00, Av. Montenegro, San Miguel. 5 km y 1.5 km. Inscripciones al 70868610." loading="lazy" width="900" height="1149" />
          </a>
          <div>
            <h2>El día de la carrera</h2>
            <p className="lead">Organiza One Life Fitness junto al Centro de Apoyo a la Mujer. Guardá el afiche y compartilo con quien quieras sumar.</p>
            <dl className="facts">
              <div><dt>Fecha</dt><dd>Domingo 22 de noviembre de 2026</dd></div>
              <div><dt>Hora</dt><dd>08:00</dd></div>
              <div><dt>Punto de partida</dt><dd>Av. Montenegro, San Miguel</dd></div>
              <div><dt>Distancias</dt><dd>5 km y 1.5 km</dd></div>
              <div><dt>Inscripciones</dt><dd><a href={WHATSAPP} target="_blank" rel="noopener noreferrer">70868610</a></dd></div>
            </dl>
            <p className="sponsors">Auspician Late Bolivia, Centro Family Care y Calacoto Hotel.</p>
          </div>
        </div>
      </section>

      <figure className="band"><img src="/landing/lapaz-banda.jpg" alt="Panorama de la ciudad de La Paz" loading="lazy" /></figure>

      <section className="cause" id="causa">
        <div className="wrap">
          <div className="cause-top">
            <div>
              <p className="cause-who">¿A quién beneficiamos?</p>
              <h2>Mujeres bolivianas en crisis</h2>
              <p className="lead">El Centro de Apoyo a la Mujer es un lugar de vida donde las mujeres reciben acogida, información y ayuda.</p>
            </div>
            <div className="cause-photos">
              <img className="cp-main" src="/landing/te-banner.jpg" alt="Voluntarias del CAM junto al banner Te necesitamos" loading="lazy" width="1182" height="914" />
              <img className="cp-side" src="/landing/voluntarios.jpg" alt="Voluntarios del CAM con una mamá y su hija" loading="lazy" width="1316" height="910" />
            </div>
          </div>
          <div className="help">
            <div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.7 4.5 7.4 4.5c2 0 3.4 1.1 4.6 2.6 1.2-1.5 2.6-2.6 4.6-2.6 3.7 0 6 3.9 4.7 7.3C19.5 16.4 12 21 12 21Z" /></svg>
              <h3>Apoyo a las mujeres</h3>
            </div>
            <div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z" /><path d="M9 10h6" /></svg>
              <h3>Atenciones psicológicas</h3>
            </div>
            <div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h12" /><path d="m12 6 6 6-6 6" /><path d="M20 4v16" /></svg>
              <h3>Derivaciones a profesionales</h3>
            </div>
          </div>
          <div className="quote">
            <img src="/logo.png" alt="" />
            <p>Cada paso ayuda a reconstruir vidas.</p>
          </div>
        </div>
      </section>

      <section className="pace-sec" id="ritmo">
        <div className="wrap">
          <div className="pace" style={{ marginTop: 0 }}>
            <div>
              <h3>No hace falta ser corredor</h3>
              <p>Los 5 km están pensados para que nadie se quede afuera. Lo importante es estar y sumar: cada inscripción cuenta igual.</p>
            </div>
            <ul>
              <li>Corriendo <span>25–35 min aprox.</span></li>
              <li>Trotando <span>35–45 min aprox.</span></li>
              <li>Caminando <span>50–65 min aprox.</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section id="pasadas">
        <div className="wrap">
          <div className="steps-head">
            <h2>Eventos pasados</h2>
            <p className="lead">CAM RUN es la primera carrera del CAM, pero no el primer encuentro. Así sumamos manos en los eventos anteriores.</p>
          </div>
          <div className="past">
            <article className="past-main">
              <img src="/landing/dia-nino.jpg" alt="Niñas, niños, mamás y voluntarios con sus regalos en el festejo del Día del Niño" loading="lazy" width="1316" height="910" />
              <div>
                <p className="past-date">2026</p>
                <h3>Festejo del Día del Niño</h3>
                <p>Una tarde de juegos, regalos y bendiciones para los hijos de las mujeres que acompaña el CAM, en la Parroquia de Alto Obrajes. Fue posible gracias a los grupos juveniles de la Parroquia de San Miguel, voluntarios de la Universidad Católica y donantes como SIMSA.</p>
                <ul className="past-stats"><li><b>1</b>juguete nuevo por niño</li><li><b>+6</b>grupos voluntarios</li></ul>
              </div>
            </article>
            <article className="past-main past-rev">
              <img src="/landing/te-mesa.jpg" alt="Asistentes compartiendo en el té solidario" loading="lazy" width="1568" height="698" />
              <div>
                <p className="past-date">Agosto 2026</p>
                <h3>Té de Recaudación de Fondos</h3>
                <p>Una tarde de charlas y comunidad en La Crêperie. Cada persona que asistió aportó su granito de arena para sostener el trabajo del CAM.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="app" id="app">
        <div className="wrap app-grid">
          <div>
            <h2>CAM RUN también va en tu bolsillo</h2>
            <p className="lead">Descargá la app y tené tu carrera a mano: inscripción, pago, número de corredor y avisos en un solo lugar.</p>
            <ul className="feats">
              <li><b>Inscripción desde el celular</b>Registrate en minutos, sin filas.</li>
              <li><b>Pago con QR</b>Pagá y subí tu comprobante desde la app.</li>
              <li><b>Cuenta regresiva y avisos</b>Recordatorios antes de la largada.</li>
              <li><b>Tus resultados</b>Mirá tu tiempo cuando cruces la meta.</li>
            </ul>
            <div className="stores">
              <StoreBadge href={PLAY_URL} icon={<GooglePlayIcon />} eyebrow="Disponible en" name="Google Play" />
              <StoreBadge href={APPSTORE_URL} icon={<AppleIcon />} eyebrow="Descárgala en" name="App Store" />
            </div>
            <div className="qr-group">
              <a className="qr-card" href={PLAY_URL} target="_blank" rel="noopener noreferrer">
                <QRCodeSVG value={PLAY_URL} size={84} bgColor="#ffffff" fgColor="#1A1130" />
                <span>Android</span>
              </a>
              <a className="qr-card" href={APPSTORE_URL} target="_blank" rel="noopener noreferrer">
                <QRCodeSVG value={APPSTORE_URL} size={84} bgColor="#ffffff" fgColor="#1A1130" />
                <span>iPhone</span>
              </a>
              <p>Escaneá con tu celular para ir directo a la tienda.</p>
            </div>
          </div>

          <div className="phones" aria-hidden="true">
            <div className="phone a"><div className="screen">
              <div className="island" />
              <div className="scr">
                <h4>Tu próxima carrera</h4>
                <div className="timer"><MiniDias /><em>para la largada</em></div>
                <div className="racecard">
                  <b>CAM RUN 5K</b><small>22 nov, 08:00, San Miguel</small>
                  <svg viewBox="0 0 160 100"><path d="M10 92 L56 72 L70 38 L106 24 L118 10 L150 4" fill="none" stroke="#C4B5FD" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="chips"><span>5 km</span><span>Benéfica</span><span>Social Run</span></div>
                <div className="rowcard"><div>Mi inscripción<small>Cupo confirmado</small></div><i>Ver</i></div>
                <div className="rowcard"><div>Comprobante<small>Validado</small></div><i>Ver</i></div>
              </div>
              <div className="tabbar"><span>Inicio</span><span>Carreras</span><span>Perfil</span></div>
            </div></div>
            <div className="phone b"><div className="screen">
              <div className="island" />
              <div className="scr">
                <h4>Mi número</h4>
                <div className="bib"><small>CAM RUN 5K</small><b>0221</b><small>Corré por la vida</small></div>
                <div className="ring">
                  <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="#EDE9FE" strokeWidth="4" /><circle cx="18" cy="18" r="15" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" strokeDasharray="94" strokeDashoffset="28" /></svg>
                  <div>3,5 km<small>de 5 km</small></div>
                </div>
                <div className="rowcard"><div>Ritmo<small>promedio</small></div><i>6:12 /km</i></div>
              </div>
              <div className="tabbar"><span>Inicio</span><span>Carreras</span><span>Perfil</span></div>
            </div></div>
          </div>
        </div>
      </section>

      <section id="preguntas">
        <div className="wrap faq">
          <div>
            <h2>Preguntas frecuentes</h2>
            <p className="lead">¿Te quedó alguna duda? Escribinos al WhatsApp 70868610 y te respondemos.</p>
          </div>
          <div>
            <details open><summary>¿Quién puede participar?</summary><p>Cualquier persona con ganas de sumar. Los 5 km son accesibles para todos los niveles: podés correr, trotar o caminar.</p></details>
            <details><summary>¿Cuándo y dónde es la carrera?</summary><p>El domingo 22 de noviembre de 2026 a las 08:00. El punto de partida es la Av. Montenegro, en San Miguel.</p></details>
            <details><summary>¿Hay distancia para niños?</summary><p>Sí. Además de los 5 km hay un recorrido de 1.5 km pensado para chicos y familias.</p></details>
            <details><summary>¿Cómo me inscribo?</summary><p>Creá tu cuenta en esta página o en la app, elegí tu distancia, pagá con el QR y subí tu comprobante. Cuando lo validemos, tu inscripción queda confirmada.</p></details>
            <details><summary>¿A dónde va el dinero de la inscripción?</summary><p>El 100% de lo recaudado va al CAM como apoyo integral a mujeres bolivianas en crisis: acompañamiento, atenciones psicológicas y derivaciones a distintos profesionales.</p></details>
            <details><summary>¿Puedo ir con amigos o con mi familia?</summary><p>Sí, es una Social Run. Inscribí a cada participante por separado para que todos tengan su número de corredor.</p></details>
            <details><summary>¿Qué tengo que llevar el día de la carrera?</summary><p>Ropa cómoda, tus tenis, tu número de corredor y agua. Llegá con tiempo para calentar antes de la largada.</p></details>
          </div>
        </div>
      </section>

      <section className="final">
        <div className="wrap">
          <div className="final-box">
            <svg className="bg" viewBox="0 0 500 500" aria-hidden="true"><path d="M60 440 L190 382 L232 250 L340 204 L380 98 L452 72" fill="none" stroke="#fff" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <h2>Nos vemos en la largada</h2>
            <p>Domingo 22 de noviembre, San Miguel. Cinco kilómetros que se convierten en apoyo real para mujeres que lo necesitan.</p>
            <button className="btn btn-main" onClick={onInscribirme}>Inscribirme ahora</button>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="wrap">
          <div className="foot">
            <div>
              <a className="lp-brand" href="/"><img src="/logo.png" alt="" />CAM RUN</a>
              <p>Carrera benéfica de 5 km a favor de mujeres bolivianas en crisis.</p>
            </div>
            <div>
              <h3>Contacto</h3>
              <ul>
                <li><a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp 70868610</a></li>
                <li><a href={FACEBOOK} target="_blank" rel="noopener noreferrer">Facebook CAM.BO.LP</a></li>
                <li><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram</a></li>
              </ul>
            </div>
            <div>
              <h3>Información</h3>
              <ul>
                <li><a href={PLAY_URL} target="_blank" rel="noopener noreferrer">App para Android</a></li>
                <li><a href={APPSTORE_URL} target="_blank" rel="noopener noreferrer">App para iPhone</a></li>
                <li><a href="/terminos">Términos y condiciones</a></li>
                <li><a href="/privacidad">Política de privacidad</a></li>
                <li><a href="/eliminar-cuenta">Eliminar tu cuenta</a></li>
              </ul>
            </div>
          </div>
          <div className="foot-legal"><span>© 2026 CAM RUN. Corré por la vida.</span><span>San Miguel, La Paz, Bolivia</span></div>
          <p className="credits">Fotos de eventos: CAM Bolivia. Fotos de Wikimedia Commons: «Jong geleerd oud gedaan, dochter doet ook mee, Ladiesrun 2015» (CC BY-SA 3.0) y «Panorama ciudad de La Paz Bolivia» (CC BY 2.0).</p>
        </div>
      </footer>

      <a className="wa-float" href={WHATSAPP_INFO} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp"><Wa /></a>
    </div>
  )
}
