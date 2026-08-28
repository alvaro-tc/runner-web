const CARRERAS = [
  {
    id: '5k',
    distancia: '5K',
    nombre: 'Carrera Solidaria',
    nivel: 'Principiante',
    nivelColor: 'nivel-verde',
    fecha: 'Fecha por confirmar',
    descripcion: 'Perfecta para quienes se inician en el running. Un recorrido accesible para todas las mujeres, sin importar su condición física.',
    incluye: ['Número de dorsal', 'Medalla finisher', 'Hidratación en ruta'],
    emoji: '🏅',
  },
  {
    id: '10k',
    distancia: '10K',
    nombre: 'Carrera del Empoderamiento',
    nivel: 'Intermedia',
    nivelColor: 'nivel-rosa',
    fecha: 'Fecha por confirmar',
    descripcion: 'Un desafío que pone a prueba tu resistencia y determinación. Para mujeres que ya tienen experiencia en carreras.',
    incluye: ['Número de dorsal', 'Medalla finisher', 'Camiseta oficial', 'Hidratación en ruta'],
    emoji: '🏆',
  },
]

export default function Races({ onAcceso }) {
  return (
    <section id="carreras" className="races-section">
      <div className="races-bg" />
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Nuestras carreras</span>
          <h2 className="section-title">Elige tu distancia</h2>
          <p className="section-subtitle">Todas las distancias son para mujeres de todas las edades y niveles. ¡Lo importante es participar!</p>
        </div>
        <div className="races-grid">
          {CARRERAS.map(c => (
            <article key={c.id} className="race-card">
              <div className="race-card-top">
                <span className="race-emoji">{c.emoji}</span>
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
                <div className="race-fecha">📅 {c.fecha}</div>
                <button className="btn-primary race-btn" onClick={() => onAcceso?.()}>
                  Inscribirse →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
