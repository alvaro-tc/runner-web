import { useState, useEffect } from 'react'
import { getPendingTransfers, confirmTransfer, getAdminRegistrations } from './api'

const ESTADO_LABEL = {
  draft: 'Borrador',
  pending_payment: 'Pendiente de pago',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
}

export default function AdminDashboard({ sesion }) {
  const [activeTab, setActiveTab] = useState('organizador')
  const [transfers, setTransfers] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (activeTab === 'organizador') {
      fetchTransfers()
    }
    if (activeTab === 'inscripciones') {
      fetchRegistrations()
    }
  }, [activeTab, statusFilter])

  async function fetchTransfers() {
    setLoading(true)
    setError(null)
    try {
      const data = await getPendingTransfers(sesion.accessToken)
      setTransfers(data)
    } catch (err) {
      setError('Error cargando pagos pendientes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRegistrations() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminRegistrations(sesion.accessToken, statusFilter || undefined)
      setRegistrations(data)
    } catch (err) {
      setError('Error cargando inscripciones: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(paymentId) {
    if (!window.confirm('¿Estás seguro de confirmar este pago?')) return
    try {
      await confirmTransfer(paymentId, sesion.accessToken)
      alert('Pago confirmado exitosamente')
      fetchTransfers() // Recargar la lista
    } catch (err) {
      alert('Error confirmando pago: ' + err.message)
    }
  }

  return (
    <div className="dashboard">
      <div className="page-title">
        <h2>Panel de control</h2>
      </div>

      <div className="tabs">
        <button className={`tab${activeTab === 'organizador' ? ' active' : ''}`} onClick={() => setActiveTab('organizador')}>
          Validar cobros
        </button>
        <button className={`tab${activeTab === 'inscripciones' ? ' active' : ''}`} onClick={() => setActiveTab('inscripciones')}>
          Inscripciones
        </button>
        <button className={`tab${activeTab === 'admin' ? ' active' : ''}`} onClick={() => setActiveTab('admin')}>
          Configuraciones
        </button>
      </div>

      {activeTab === 'organizador' && (
        <div className="card">
          <div className="panel-header">
            <h3>Transferencias pendientes</h3>
          </div>
          {error && <p className="error">{error}</p>}
          {loading ? (
            <p>Cargando...</p>
          ) : transfers.length === 0 ? (
            <div className="state-card">
              <div className="state-icon">✨</div>
              <p style={{ margin: 0 }}>No hay transferencias pendientes por confirmar.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>ID pago</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map(t => (
                    <tr key={t.id}>
                      <td>{t.id.slice(0, 8)}...</td>
                      <td>{(t.amountCents / 100).toFixed(2)} {t.currency}</td>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(t.id)}>
                          Confirmar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inscripciones' && (
        <div className="card">
          <div className="panel-header">
            <h3>Inscripciones</h3>
            <label className="filter-row">
              Estado
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Todas</option>
                {Object.entries(ESTADO_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          {loading ? (
            <p>Cargando...</p>
          ) : registrations.length === 0 ? (
            <div className="state-card">
              <div className="state-icon">📋</div>
              <p style={{ margin: 0 }}>No hay inscripciones para este filtro.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Corredor</th>
                    <th>Maratón</th>
                    <th>Dorsal</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(r => (
                    <tr key={r.id}>
                      <td>
                        {r.runner}
                        <div className="cell-sub">{r.email}</div>
                      </td>
                      <td>{r.marathon}</td>
                      <td>{r.bibNumber || '—'}</td>
                      <td>
                        <span className={`badge-status badge-${r.status}`}>
                          {ESTADO_LABEL[r.status] || r.status}
                        </span>
                      </td>
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

      {activeTab === 'admin' && (
        <div className="card">
          <h3>Configuraciones de administrador</h3>
          <p>Esta sección está en construcción. Aquí podrás:</p>
          <ul>
            <li>Cambiar el QR de pago</li>
            <li>Cambiar el monto (Service Fee)</li>
          </ul>
        </div>
      )}
    </div>
  )
}
