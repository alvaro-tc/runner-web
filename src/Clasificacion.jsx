import { useEffect, useState } from 'react'
import { Icon } from './components/AdminCharts'
import { getRanking, saveRanking } from './api'

const tiempo = s => {
  if (s == null) return '—'
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(x).padStart(2, '0')}`
}
const detalleGps = (f, carrera) => [
  `GPS: ${km(f.distanceMeters)}`,
  f.lapsCompleted != null && carrera.laps > 1 && `${f.lapsCompleted}/${carrera.laps} vueltas`,
  f.routeCoverage != null && `${Math.round(f.routeCoverage * 100)}% del recorrido`,
].filter(Boolean).join(' · ')
const km = m => `${(m / 1000).toLocaleString('es-BO', { maximumFractionDigits: 1 })} km`

/// Clasificacion de una carrera. El organizador corrige el orden de llegada
/// arrastrando, con las flechas o escribiendo el puesto: arrastrar no puede ser
/// la unica forma (WCAG 2.5.7), y en una lista de 300 escribir "4" es lo rapido.
export default function Clasificacion({ token, carrera, editable }) {
  const [original, setOriginal] = useState([])
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [arrastrada, setArrastrada] = useState(null)
  const [q, setQ] = useState('')

  function aplicar(lista) { setOriginal(lista); setFilas(lista) }

  useEffect(() => {
    setCargando(true)
    getRanking(token, carrera.id).then(aplicar, e => setError(e.message)).finally(() => setCargando(false))
  }, [carrera.id])

  const cambios = filas.filter((f, i) => original[i]?.registrationId !== f.registrationId).length
  const hayManual = original.some(f => f.manual)

  function mover(desde, hasta) {
    hasta = Math.max(0, Math.min(filas.length - 1, hasta))
    if (desde === hasta) return
    const lista = [...filas]
    const [f] = lista.splice(desde, 1)
    lista.splice(hasta, 0, f)
    setFilas(lista); setAviso('')
  }

  async function guardar(ids, ok) {
    setGuardando(true); setError(''); setAviso('')
    try { aplicar(await saveRanking(token, carrera.id, ids)); setAviso(ok) }
    catch (e) { setError(e.message) }
    finally { setGuardando(false) }
  }

  function automatico() {
    if (window.confirm('¿Volver al orden automático?\n\nSe descartan todas las correcciones y los puestos se recalculan por tiempo.'))
      guardar([], 'Volviste al orden automático')
  }

  const busqueda = q.trim().toLowerCase()
  const coincide = f => !busqueda || f.runner?.toLowerCase().includes(busqueda) || String(f.bibNumber || '').includes(busqueda)

  if (cargando) return <div className="ad-card"><div className="ad-skel ad-skel-table" /></div>

  return (
    <section className="ad-card ad-rank">
      <header className="ad-card-head">
        <div>
          <h2>Clasificación <span className="ad-count">{filas.length}</span></h2>
          <p>{editable ? 'Arrastrá, usá las flechas o escribí el puesto para corregir el orden de llegada.' : 'Orden oficial de llegada.'}</p>
        </div>
        <div className="ad-rank-tools">
          <label className="ad-search" role="search">
            <Icon name="search" size={16} />
            <input type="search" placeholder="Nombre o dorsal" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar corredor" />
          </label>
          {editable && hayManual && <button className="ad-btn is-sm is-ghost" onClick={automatico} disabled={guardando}><Icon name="refresh" size={16} />Orden automático</button>}
        </div>
      </header>

      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
      {aviso && <p className="ad-rank-ok" role="status"><Icon name="check" size={16} />{aviso}</p>}

      {filas.length === 0 ? (
        <div className="ad-chart-empty"><Icon name="trophy" size={22} /><p>Todavía no hay resultados. Aparecen cuando los corredores cruzan la meta o cuando finalizás la carrera.</p></div>
      ) : (
        <>
          {editable && filas.some(f => !f.finishDetected) && (
            <p className="ad-rank-note"><Icon name="info" size={16} />Las filas marcadas <b>Sin meta</b> no completaron el recorrido según el GPS (no llegaron al arco, les faltan vueltas o hay tramos sin puntos): revisalas primero.</p>
          )}
          <ol className="ad-rank-list">
            {filas.map((f, i) => coincide(f) && (
              <li key={f.registrationId}
                className={`ad-rank-row${arrastrada === i ? ' is-drag' : ''}${original[i]?.registrationId !== f.registrationId ? ' is-moved' : ''}`}
                draggable={editable && !guardando}
                onDragStart={e => { setArrastrada(i); e.dataTransfer.effectAllowed = 'move' }}
                onDragOver={e => { if (arrastrada === null) return; e.preventDefault(); if (arrastrada !== i) { mover(arrastrada, i); setArrastrada(i) } }}
                onDragEnd={() => setArrastrada(null)}>
                {editable && <span className="ad-rank-grip" aria-hidden="true"><Icon name="list" size={16} /></span>}
                {editable ? (
                  <input className={`ad-rank-pos${i < 3 ? ` is-p${i + 1}` : ''}`} type="number" min="1" max={filas.length} aria-label={`Puesto de ${f.runner}`}
                    key={`${f.registrationId}-${i}`} defaultValue={i + 1}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                    onBlur={e => { const n = parseInt(e.target.value, 10); if (n >= 1) mover(i, n - 1); else e.target.value = i + 1 }} />
                ) : <span className={`ad-rank-pos${i < 3 ? ` is-p${i + 1}` : ''}`}>{f.overallRank ?? i + 1}</span>}
                <div className="ad-rank-who">
                  <div className="cell-name">{f.runner}</div>
                  <div className="cell-sub">
                    {f.bibNumber && <span className="ad-bib">{f.bibNumber}</span>}
                    {f.categoryName && <span>{f.categoryName}{f.categoryRank ? ` · #${f.categoryRank}` : ''}</span>}
                  </div>
                </div>
                <div className="ad-rank-tags">
                  {!f.finishDetected && <span className="ad-pill is-sm is-warn" title={detalleGps(f, carrera)}>Sin meta</span>}
                  {f.routeCoverage != null && <span className="ad-rank-cov" title="Parte del recorrido oficial con puntos GPS">{Math.round(f.routeCoverage * 100)}% ruta</span>}
                  {f.manual && <span className="ad-pill is-sm is-violet">Corregido</span>}
                </div>
                <span className="ad-rank-time">{tiempo(f.finishTimeSeconds)}</span>
                {editable && (
                  <div className="ad-rank-arrows">
                    <button className="ad-icon-btn" disabled={i === 0 || guardando} onClick={() => mover(i, i - 1)} aria-label={`Subir a ${f.runner}`}><Icon name="chevron" size={16} style={{ transform: 'rotate(180deg)' }} /></button>
                    <button className="ad-icon-btn" disabled={i === filas.length - 1 || guardando} onClick={() => mover(i, i + 1)} aria-label={`Bajar a ${f.runner}`}><Icon name="chevron" size={16} /></button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      {editable && cambios > 0 && (
        <div className="ad-rank-bar" role="region" aria-label="Cambios sin guardar">
          <span><b>{cambios}</b> {cambios === 1 ? 'puesto cambiado' : 'puestos cambiados'}</span>
          <button className="ad-btn is-sm is-ghost" onClick={() => setFilas(original)} disabled={guardando}>Descartar</button>
          <button className="ad-btn is-sm is-primary" onClick={() => guardar(filas.map(f => f.registrationId), 'Clasificación guardada. Los corredores ya ven su nuevo puesto.')} disabled={guardando}>
            {guardando ? <span className="ad-spinner" /> : <Icon name="check" size={16} />}Guardar orden
          </button>
        </div>
      )}
    </section>
  )
}
