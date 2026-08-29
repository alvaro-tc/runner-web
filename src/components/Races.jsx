const CARRERAS = [
  {
    id: '5k',
    distancia: '5K',
    nombre: 'Carrera Solidaria',
    nivel: 'Principiante',
    nivelColor: 'nivel-verde',
    fecha: 'Fecha por confirmar',
    descripcion: 'Un recorrido participativo y accesible. Ideal para quienes se inician en el running o prefieren caminar.',
    incluye: ['Número de dorsal', 'Medalla finisher', 'Hidratación en ruta'],
  },
  {
    id: '10k',
    distancia: '10K',
    nombre: 'Carrera Competitiva',
    nivel: 'Intermedia',
    nivelColor: 'nivel-rosa',
    fecha: 'Fecha por confirmar',
    descripcion: 'Desafío cronometrado para poner a prueba tu resistencia. Orientado a corredoras con experiencia previa.',
    incluye: ['Número de dorsal', 'Medalla finisher', 'Camiseta oficial', 'Hidratación en ruta'],
  },
]

export default function Races({ onAcceso }) {
  return (
    <section id="carreras" className="races-section">
      <div className="races-bg" />
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Modalidades</span>
          <h2 className="section-title">Elige tu distancia</h2>
          <p className="section-subtitle">Opciones adaptadas a diferentes niveles de preparación física. Tu participación es lo que realmente importa.</p>
        </div>
        <div className="races-grid">
          {CARRERAS.map(c => (
            <article key={c.id} className="race-card">
              <div className="race-card-top">
                <div className="race-dist">{c.distancia}</div>
                <span className={`nivel-badge ${c.nivelColor}`}>{c.nivel}</span>
              </div>
              <div className="race-card-body">
                <h3>{c.nombre}</h3>
                <p>{c.descripcion}</p>
                <ul className="race-includes">
                  {c.incluye.map(item => (
                    <li key={item}><span>✓</span> {item}</li>
                  ))}
                </ul>
                <div className="race-fecha">{c.fecha}</div>
                <button className="btn-primary race-btn" onClick={() => onAcceso?.()}>
                  Inscribirse
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}