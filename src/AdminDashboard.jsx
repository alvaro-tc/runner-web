import { useState, useEffect } from 'react'
import { getPendingTransfers, confirmTransfer, getAdminRegistrations } from './api'

const ESTADO_LABEL = {
  draft: 'Borrador',
  pending_payment: 'Pago pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
}

const ESTADO_CLASS = {
  draft: 'badge-draft',
  pending_payment: 'badge-pending',
  confirmed: 'badge-confirmed',
  cancelled: 'badge-cancelled',
  refunded: 'badge-refunded',
}

export default function AdminDashboard({ sesion }) {
  const [activeTab, setActiveTab] = useState('organizador')
  const [transfers, setTransfers] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (activeTab === 'organizador') fetchTransfers()
    if (activeTab === 'inscripciones') fetchRegistrations()
  }, [activeTab, statusFilter])

  async function fetchTransfers() {
    setLoading(true); setError(null)
    try { setTransfers(await getPendingTransfers(sesion.accessToken)) }
    catch (err) { setError('Error cargando pagos: ' + err.message) }
    finally { setLoading(false) }
  }

  async function fetchRegistrations() {
    setLoading(true); setError(null)
    try { setRegistrations(await getAdminRegistrations(sesion.accessToken, statusFilter || undefined)) }
    catch (err) { setError('Error cargando inscripciones: ' + err.message) }
    finally { setLoading(false) }
  }

  async function handleConfirm(paymentId) {
    if (!window.confirm('¿Confirmar este pago?')) return
    try {
      await confirmTransfer(paymentId, sesion.accessToken)
      alert('¡Pago confirmado exitosamente!')
      fetchTransfers()
    } catch (err) { alert('Error: ' + err.message) }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>⚙️ Panel Administrativo</h1>
          <p>Centro de Apoyo a la Mujer · Maratón de la Mujer</p>
        </div>
      </div>

      <div className="dashboard-body container">
        <div className="dash-tabs">
          {[['organizador', '💳 Validar cobros'], ['inscripciones', '📋 Inscripciones'], ['admin', '⚙️ Configuración']].map(([key, label]) => (
            <button key={key} className={`dash-tab${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {error && <p className="dash-error">{error}</p>}
        {loading && <div className="dash-loading"><span>Cargando…</span></div>}

        {activeTab === 'organizador' && !loading && (
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>Transferencias pendientes</h2>
              <button className="btn-outline-sm" onClick={fetchTransfers}>🔄 Actualizar</button>
            </div>
            {transfers.length === 0 ? (
              <div className="dash-empty"><span>✨</span><p>No hay transferencias pendientes.</p></div>
            ) : (
              <div className="table-wrap">
                <table className="dash-table">
                  <thead><tr><th>ID Pago</th><th>Monto</th><th>Fecha</th><th>Acción</th></tr></thead>
                  <tbody>
                    {transfers.map(t => (
                      <tr key={t.id}>
                        <td><code>{t.id.slice(0, 8)}…</code></td>
                        <td><strong>{(t.amountCents / 100).toFixed(2)} {t.currency}</strong></td>
                        <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td><button className="btn-primary-sm" onClick={() => handleConfirm(t.id)}>✓ Confirmar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inscripciones' && !loading && (
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>Inscripciones</h2>
              <label className="dash-filter">
                Filtrar:
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">Todas</option>
                  {Object.entries(ESTADO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
            {registrations.length === 0 ? (
              <div className="dash-empty"><span>📋</span><p>No hay inscripciones para este filtro.</p></div>
            ) : (
              <div className="table-wrap">
                <table className="dash-table">
                  <thead><tr><th>Corredora</th><th>Maratón</th><th>Dorsal</th><th>Estado</th><th>Total</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {registrations.map(r => (
                      <tr key={r.id}>
                        <td><div className="cell-name">{r.runner}</div><div className="cell-sub">{r.email}</div></td>
                        <td>{r.marathon}</td>
                        <td>{r.bibNumber || '—'}</td>
                        <td><span className={`status-badge ${ESTADO_CLASS[r.status] || ''}`}>{ESTADO_LABEL[r.status] || r.status}</span></td>
                        <td>{(r.totalCents / 100).toFixed(2)}</td>
                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && !loading && (
          <div className="dash-card">
            <div className="dash-card-header"><h2>Configuración</h2></div>
            <div className="dash-empty">
              <span>🔧</span>
              <p>Esta sección está en construcción. Aquí podrás cambiar el QR de pago y el monto del service fee.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
