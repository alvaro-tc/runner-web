import { useEffect, useState } from 'react'
import { Icon } from './components/AdminCharts'
import { getPlataforma, setPaymentApi, setMarathonValidator } from './api'

const fecha = iso => new Date(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })

// Administrador de plataforma: enciende la API de pagos y elige quién valida cada carrera.
export default function PanelPlataforma({ sesion }) {
  const token = sesion.accessToken
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [guardando, setGuardando] = useState('')

  const cargar = () => getPlataforma(token).then(setD, e => setError(e.message))
  useEffect(() => { cargar() }, [])

  async function accion(clave, fn, mensaje) {
    setGuardando(clave); setError(''); setOk('')
    try { await fn(); await cargar(); setOk(mensaje) }
    catch (e) { setError(e.message) }
    finally { setGuardando('') }
  }

  if (!d) return error ? <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p> : <div className="ad-loading"><span className="ad-spinner" /> Cargando…</div>

  const on = d.paymentApiEnabled

  return (
    <div className="ad-mod">
      <header className="ad-head">
        <div>
          <p className="ad-eyebrow">Plataforma</p>
          <h1>Validación de pagos</h1>
          <p className="ad-head-meta">Elegí si los cobros los valida la API de pagos o un organizador. Cada cambio queda en auditoría.</p>
        </div>
      </header>

      {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
      {ok && <p className="ad-alert" role="status"><Icon name="check" />{ok}</p>}

      <section className="ad-card">
        <header className="ad-card-head"><div><h2>API de pagos</h2><p>Genera el QR de cada cobro y lo confirma sola cuando el banco avisa.</p></div></header>
        <div className="ad-toggle-row">
          <div>
            <strong>{on ? 'Encendida: automática' : 'Apagada: validación manual'}</strong>
            <small>
              {!d.paymentApiConfigured ? 'Falta configurar PASARELA_API_URL y PASARELA_API_KEY en el servidor.'
                : on ? 'Las carreras asignadas a la API cobran con su QR. El resto sigue manual.'
                  : 'Todas las carreras usan su QR por defecto y un organizador valida el comprobante.'}
            </small>
          </div>
          <button type="button" role="switch" aria-checked={on} aria-label="API de pagos encendida" disabled={guardando === 'api' || (!on && !d.paymentApiConfigured)}
            className={`ad-switch-tg${on ? ' is-on' : ''}`}
            onClick={() => accion('api', () => setPaymentApi(token, !on), on ? 'API de pagos apagada' : 'API de pagos encendida')}><i /></button>
        </div>
      </section>

      <section className="ad-card ad-table-card">
        <header className="ad-card-head"><div><h2>Quién valida cada carrera</h2><p>Los organizadores no asignados solo pueden ver los cobros.</p></div></header>
        {d.marathons.length === 0 ? <div className="ad-chart-empty"><Icon name="flag" size={22} /><p>Todavía no hay carreras.</p></div> : (
          <div className="ad-table-wrap">
            <table className="ad-table ad-table-cards">
              <thead><tr><th>Carrera</th><th>Validador</th><th>Cómo se cobra</th></tr></thead>
              <tbody>
                {d.marathons.map(m => {
                  const esApi = m.validator?.id === d.apiUserId
                  const cobro = esApi && on ? 'QR de la API, automático'
                    : esApi ? 'API apagada: QR por defecto, cualquiera valida'
                      : m.hasDefaultQr ? 'QR por defecto, validación manual' : 'Sin QR por defecto cargado'
                  return (
                    <tr key={m.id}>
                      <td><div className="cell-name">{m.name}</div><div className="cell-sub">{fecha(m.startsAt)}</div></td>
                      <td data-l="Validador">
                        <label className="ad-field" style={{ margin: 0 }}><span className="sr-only">Validador de {m.name}</span>
                          <select value={m.validator?.id || ''} disabled={guardando === m.id}
                            onChange={e => accion(m.id, () => setMarathonValidator(token, m.id, e.target.value || null), `Validador de ${m.name} actualizado`)}>
                            <option value="">Cualquiera que valide cobros</option>
                            {d.candidates.map(u => <option key={u.id} value={u.id}>{u.id === d.apiUserId ? 'API de pagos (automático)' : `${u.name}${u.email ? ` · ${u.email}` : ''}`}</option>)}
                          </select>
                        </label>
                      </td>
                      <td data-l="Cómo se cobra"><span className={`ad-pill${esApi && on ? ' is-ok' : !esApi && !m.hasDefaultQr ? ' is-warn' : ''}`}>{cobro}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
