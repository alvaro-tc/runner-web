import { useState, useEffect } from 'react'
import DonationReceipt from './components/DonationReceipt'
import {
  getAdminPayments,
  confirmTransfer,
  getAdminRegistrations,
  getAdminMarathons,
  getAdminUsers,
  downloadPaymentsCsv,
  approvePaymentProof,
  rejectPaymentProof,
} from './api'
import { ROL_LABEL } from './roles'

const PAGO_LABEL = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
}

const PAGO_CLASS = {
  pending: 'badge-pending',
  paid: 'badge-confirmed',
  failed: 'badge-cancelled',
  refunded: 'badge-refunded',
}

const METODO_LABEL = {
  qr_manual: 'QR',
  bank_transfer: 'Transferencia',
  qr: 'QR',
  card: 'Tarjeta',
}

const PAGE_SIZE_PAGOS = 20

// Panel del organizador: inscritas, validar cobros y cuentas. El admin usa PanelCarreras y el OSI PanelOsi.
export default function AdminDashboard({ sesion }) {
  const [activeTab, setActiveTab] = useState('inscripciones')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [payments, setPayments] = useState([])
  const [payTotal, setPayTotal] = useState(0)
  const [payPage, setPayPage] = useState(1)
  const [paySearch, setPaySearch] = useState('')
  const [payStatus, setPayStatus] = useState('pending')
  const [payMarathon, setPayMarathon] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [registrations, setRegistrations] = useState([])
  const [marathons, setMarathons] = useState([])
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [searchTerm, setSearchTerm] = useState('')
  const [userSearch, setUserSearch] = useState('')

  const [receiptData, setReceiptData] = useState(null)

  useEffect(() => {
    if (activeTab === 'inscripciones') fetchRegistrations()
    if (activeTab === 'usuarios') fetchUsers()
  }, [activeTab, page])

  useEffect(() => {
    if (activeTab === 'pagos') fetchPayments()
  }, [activeTab, payPage, payStatus, payMarathon])

  // El filtro por carrera necesita la lista; el organizador también puede leerla.
  useEffect(() => {
    if (activeTab === 'pagos' && marathons.length === 0) {
      getAdminMarathons(sesion.accessToken).then(setMarathons).catch(() => {})
    }
  }, [activeTab])

  async function fetchPayments() {
    setLoading(true); setError(null)
    try {
      const result = await getAdminPayments(sesion.accessToken, {
        q: paySearch.trim(), status: payStatus, marathonId: payMarathon, page: payPage, pageSize: PAGE_SIZE_PAGOS,
      })
      setPayments(result.data || [])
      setPayTotal(result.meta?.total || 0)
    }
    catch (err) { setError('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  function handlePaySearch() {
    if (payPage === 1) fetchPayments()
    else setPayPage(1)
  }

  async function fetchRegistrations() {
    setLoading(true); setError(null)
    try {
      // Solo las inscritas de verdad: las que ya tienen el pago confirmado.
      const result = await getAdminRegistrations(sesion.accessToken, {
        status: 'confirmed', search: searchTerm, page, limit: 40,
      })
      // El backend devuelve { data: [...], meta: {...} }
      setRegistrations(result.data || [])
      setTotalPages(result.meta?.totalPages || 1)
      setTotalItems(result.meta?.total || 0)
    }
    catch (err) { setError('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  async function fetchUsers() {
    setLoading(true); setError(null)
    try { setUsers(await getAdminUsers(sesion.accessToken, userSearch)) }
    catch (err) { setError('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  function openPayment(p) {
    setSelectedPayment(p)
    setReviewNote('')
  }

  // Con comprobante QR se aprueba el comprobante; sin él, se confirma la transferencia a mano.
  async function handleApprovePayment() {
    const p = selectedPayment
    setReviewing(true)
    try {
      if (p.proofId) await approvePaymentProof(p.proofId, reviewNote, sesion.accessToken)
      else await confirmTransfer(p.id, sesion.accessToken)
      setSelectedPayment(null)
      fetchPayments()
      setReceiptData({
        receiptNumber: String(p.id).slice(-8).toUpperCase(),
        paymentId: p.id,
        donor: p.runner,
        concept: p.marathon,
        amountCents: p.amountCents,
        currency: 'Bolivianos',
        currencySymbol: 'Bs',
        date: new Date(),
      })
    } catch (err) { alert('Error: ' + err.message) }
    finally { setReviewing(false) }
  }

  async function handleRejectPayment() {
    if (!reviewNote.trim()) { alert('Escribe el motivo del rechazo: la corredora lo verá.'); return }
    setReviewing(true)
    try {
      await rejectPaymentProof(selectedPayment.proofId, reviewNote, sesion.accessToken)
      setSelectedPayment(null)
      fetchPayments()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setReviewing(false) }
  }

  function handleSearch() {
    setPage(1)
    fetchRegistrations()
  }

  async function handleExportPaymentsCsv() {
    try { await downloadPaymentsCsv(sesion.accessToken, { q: paySearch, status: payStatus, marathonId: payMarathon }) }
    catch (err) { alert('Error: ' + err.message) }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>Panel de Organizador</h1>
          <p>CAM RUN 2026, domingo 22 de noviembre en San Miguel</p>
        </div>
      </div>

      <div className="dashboard-body container">
        <div className="dash-tabs">
          {[
            ['inscripciones', 'Inscripciones'],
            ['pagos', 'Validar cobros'],
            ['usuarios', 'Usuarios'],
          ].filter(Boolean).map(([key, label]) => (
            <button key={key} className={`dash-tab${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {error && <p className="dash-error">{error}</p>}
        {loading && <div className="dash-loading"><span>Cargando…</span></div>}

        {/* INSCRIPCIONES */}
        {activeTab === 'inscripciones' && !loading && (
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>Inscritas ({totalItems})</h2>
              <div className="dash-search-bar">
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="dash-search-input" />
                <button className="btn-outline-sm" onClick={handleSearch}>Buscar</button>
              </div>
            </div>
            {registrations.length === 0 ? (
              <div className="dash-empty"><span></span><p>No hay inscritas.</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>Corredora</th><th>CI</th><th>Celular</th><th>CAM</th><th>Donador</th><th>Carrera</th><th>Dorsal</th><th>Total</th><th>Recibo</th></tr></thead>
                    <tbody>
                      {registrations.map(r => (
                        <tr key={r.id}>
                          <td><div className="cell-name">{r.runner}</div><div className="cell-sub">{r.email}</div></td>
                          <td>{r.docId || '—'}</td>
                          <td>{r.phone || '—'}</td>
                          <td>{r.knowsCam === null ? '—' : r.knowsCam ? 'Sí' : 'No'}</td>
                          <td>{r.acceptsDonorCall === null ? '—' : r.acceptsDonorCall ? 'Sí' : 'No'}</td>
                          <td>{r.marathon}</td>
                          <td>{r.bibNumber || '—'}</td>
                          <td>{(r.totalCents / 100).toFixed(2)} Bs</td>
                          <td>
                            <button
                                className="btn-outline-sm"
                                onClick={() => setReceiptData({
                                  receiptNumber: String(r.id).slice(-8).toUpperCase(),
                                  paymentId: r.id,
                                  donor: r.runner,
                                  concept: r.marathon,
                                  amountCents: r.totalCents,
                                  currency: 'Bolivianos',
                                  currencySymbol: 'Bs',
                                  date: new Date(),
                                })}
                              >
                                Recibo
                              </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <button className="btn-outline-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>←</button>
                  <span>Página {page} de {totalPages}</span>
                  <button className="btn-outline-sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>→</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* VALIDAR COBROS */}
        {activeTab === 'pagos' && (
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>Cobros ({payTotal})</h2>
              <div className="dash-search-bar">
                <input type="search" placeholder="Nombre, CI, celular, dorsal o nº de transacción" value={paySearch} onChange={e => setPaySearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePaySearch()} className="dash-search-input" />
                <button className="btn-outline-sm" onClick={handlePaySearch}>Buscar</button>
                <select value={payStatus} onChange={e => { setPayStatus(e.target.value); setPayPage(1) }} aria-label="Estado del cobro">
                  <option value="">Todos los estados</option>
                  {Object.entries(PAGO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={payMarathon} onChange={e => { setPayMarathon(e.target.value); setPayPage(1) }} aria-label="Carrera">
                  <option value="">Todas las carreras</option>
                  {marathons.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <button className="btn-outline-sm" onClick={handleExportPaymentsCsv}>Exportar a Excel</button>
              </div>
            </div>
            {loading ? null : payments.length === 0 ? <div className="dash-empty"><span></span><p>No hay cobros con estos filtros.</p></div> : (
              <>
                <div className="table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>Corredora</th><th>CI</th><th>Celular</th><th>Carrera</th><th>Monto</th><th>Método</th><th>Estado</th><th>Validado por</th><th>Acción</th></tr></thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id}>
                          <td><div className="cell-name">{p.runner}</div><div className="cell-sub">{p.runnerEmail}</div></td>
                          <td>{p.runnerCi || '—'}</td>
                          <td>{p.runnerPhone || '—'}</td>
                          <td>{p.marathon}</td>
                          <td><strong>{(p.amountCents / 100).toFixed(2)} Bs</strong></td>
                          <td>{METODO_LABEL[p.method] || p.method}</td>
                          <td>
                            <span className={`status-badge ${PAGO_CLASS[p.status] || ''}`}>{PAGO_LABEL[p.status] || p.status}</span>
                            {p.status === 'pending' && <div className="cell-sub">{p.proofId ? 'Comprobante por revisar' : p.proofStatus === 'rejected' ? 'Comprobante rechazado' : 'Sin comprobante'}</div>}
                          </td>
                          <td>{p.validatedBy || '—'}</td>
                          <td>
                            {p.status === 'pending'
                              ? <button className="btn-primary-sm" onClick={() => openPayment(p)}>Validar</button>
                              : <button className="btn-outline-sm" onClick={() => openPayment(p)}>Ver</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <button className="btn-outline-sm" disabled={payPage <= 1} onClick={() => setPayPage(p => p - 1)}>←</button>
                  <span>Página {payPage} de {Math.max(1, Math.ceil(payTotal / PAGE_SIZE_PAGOS))}</span>
                  <button className="btn-outline-sm" disabled={payPage * PAGE_SIZE_PAGOS >= payTotal} onClick={() => setPayPage(p => p + 1)}>→</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* USUARIOS */}
        {activeTab === 'usuarios' && !loading && (
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>Usuarios ({users.length})</h2>
              <div className="dash-search-bar">
                <input type="text" placeholder="Buscar..." value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()} className="dash-search-input" />
                <button className="btn-outline-sm" onClick={fetchUsers}>Buscar</button>
              </div>
            </div>
            {users.length === 0 ? <div className="dash-empty"><span></span><p>No hay usuarios.</p></div> : (
              <div className="table-wrap">
                <table className="dash-table">
                  <thead><tr><th>Nombre</th><th>Email</th><th>CI</th><th>Rol</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email || '—'}</td>
                        <td>{u.ci || '—'}</td>
                        <td>
                          <span className={`status-badge ${u.role === 'admin' ? 'badge-confirmed' : 'badge-pending'}`}>{ROL_LABEL[u.role] || u.role}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL VALIDAR COBRO */}
      {selectedPayment && (
        <div className="modal-overlay" onClick={() => !reviewing && setSelectedPayment(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cobro de {selectedPayment.runner}</h2>
              <button className="modal-close" onClick={() => setSelectedPayment(null)} aria-label="Cerrar">×</button>
            </div>
            <div className="modal-body payment-review">
              <div className="payment-review-proof">
                {selectedPayment.proofImageUrl ? (
                  <a href={selectedPayment.proofImageUrl} target="_blank" rel="noreferrer" title="Abrir en tamaño completo">
                    <img src={selectedPayment.proofImageUrl} alt={`Comprobante de ${selectedPayment.runner}`} />
                  </a>
                ) : (
                  <div className="dash-empty"><p>No se subió comprobante.</p></div>
                )}
              </div>
              <div>
                <dl className="payment-review-data">
                  <dt>Monto</dt><dd><strong>{(selectedPayment.amountCents / 100).toFixed(2)} Bs</strong></dd>
                  <dt>Carrera</dt><dd>{selectedPayment.marathon}</dd>
                  <dt>CI</dt><dd>{selectedPayment.runnerCi || '—'}</dd>
                  <dt>Celular</dt><dd>{selectedPayment.runnerPhone || '—'}</dd>
                  <dt>Email</dt><dd>{selectedPayment.runnerEmail || '—'}</dd>
                  <dt>Método</dt><dd>{METODO_LABEL[selectedPayment.method] || selectedPayment.method}</dd>
                  <dt>Referencia</dt><dd>{selectedPayment.proofReference || 'No indicada'}</dd>
                  <dt>Fecha</dt><dd>{new Date(selectedPayment.createdAt).toLocaleString()}</dd>
                  <dt>Estado</dt><dd>{PAGO_LABEL[selectedPayment.status] || selectedPayment.status}</dd>
                  {selectedPayment.validatedBy && <><dt>Validado por</dt><dd>{selectedPayment.validatedBy}</dd></>}
                  {selectedPayment.proofNote && <><dt>Nota</dt><dd>{selectedPayment.proofNote}</dd></>}
                </dl>
                {selectedPayment.status === 'pending' && selectedPayment.proofId && (
                  <label className="form-label">Nota (obligatoria para rechazar)
                    <textarea className="form-input" rows="2" value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Ej.: el monto no coincide con el extracto" />
                  </label>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setSelectedPayment(null)} disabled={reviewing}>Cerrar</button>
              {selectedPayment.status === 'pending' && selectedPayment.proofId && (
                <button className="btn-danger-sm" onClick={handleRejectPayment} disabled={reviewing}>Rechazar</button>
              )}
              {selectedPayment.status === 'pending' && (
                <button className="btn-primary" onClick={handleApprovePayment} disabled={reviewing}>
                  {reviewing ? 'Guardando…' : selectedPayment.proofId ? 'Aprobar pago' : 'Confirmar sin comprobante'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {receiptData && (
        <DonationReceipt
          data={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  )
}
