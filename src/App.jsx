import Login from './Login'
import { BASE } from './api'

const SERVICIOS = [
  { icon: '💜', title: 'Acompañamiento', text: 'Apoyo emocional y seguimiento personalizado para cada mujer que llega al centro.' },
  { icon: '⚖️', title: 'Orientación legal', text: 'Asesoría gratuita sobre derechos, denuncias y procesos de protección.' },
  { icon: '🏃‍♀️', title: 'Rutas seguras', text: 'Actividad física en grupo con rutas verificadas y acompañamiento en tiempo real.' },
  { icon: '📞', title: 'Línea de ayuda', text: 'Atención disponible todos los días para orientación inmediata.' },
]

export default function App() {
  return (
    <div className="page">
      <section className="hero">
        <span className="badge">CAM</span>
        <h1>Centro de Apoyo a la Mujer</h1>
        <p>
          Un espacio seguro de acompañamiento, orientación y comunidad. Estamos
          contigo en cada paso del camino.
        </p>
        <a className="cta" href="#servicios">Conocer servicios</a>
      </section>

      <section id="servicios" className="cards">
        {SERVICIOS.map((s) => (
          <article className="card" key={s.title}>
            <div className="icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </article>
        ))}
      </section>

      <section className="cards">
        <Login />
      </section>

      <footer>API: {BASE}</footer>
    </div>
  )
}
