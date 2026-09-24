import { useState, useEffect } from 'react'
import DonationReceiptCanvas from './components/DonationReceiptCanvas'
import {
  getPendingTransfers,
  confirmTransfer,
  getAdminRegistrations,
  getAdminMarathons,
  getAdminUsers,
  uploadMarathonQR,
  createMarathon,
  updateMarathon,
  deleteMarathon,
  publishMarathon,
  unpublishMarathon,
  deleteUser,
  updateUser,
} from './api'

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
  const [activeTab, setActiveTab] = useState('inscripciones')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [transfers, setTransfers] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [marathons, setMarathons] = useState([])
  const [users, setUsers] = useState([])
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [marathonSearch, setMarathonSearch] = useState('')
  
  const [showMarathonModal, setShowMarathonModal] = useState(false)
  const [editingMarathon, setEditingMarathon] = useState(null)
  const [marathonForm, setMarathonForm] = useState({
    name: '', city: '', startsAt: '', distanceMeters: '', capacity: '', priceCents: '', description: '',
  })
  
  const [qrMarathon, setQrMarathon] = useState(null)
  const [qrFile, setQrFile] = useState(null)
  const [qrAmount, setQrAmount] = useState('')
  const [qrUploading, setQrUploading] = useState(false)
  const [receiptData, setReceiptData] = useState(null)

  useEffect(() => {
    if (activeTab === 'pagos') fetchTransfers()
    if (activeTab === 'inscripciones') fetchRegistrations()
    if (activeTab === 'maratones') fetchMarathons()
    if (activeTab === 'usuarios') fetchUsers()
  }, [activeTab, statusFilter, page])

  async function fetchTransfers() {
    setLoading(true); setError(null)
    try { setTransfers(await getPendingTransfers(sesion.accessToken)) }
    catch (err) { setError('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  async function fetchRegistrations() {
    setLoading(true); setError(null)
    try {
      const result = await getAdminRegistrations(sesion.accessToken, {
        status: statusFilter, search: searchTerm, page, limit: 40,
      })
      // El backend devuelve { data: [...], meta: {...} }
      setRegistrations(result.data || [])
      setTotalPages(result.meta?.totalPages || 1)
      setTotalItems(result.meta?.total || 0)
    }
    catch (err) { setError('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  async function fetchMarathons() {
    setLoading(true); setError(null)
    try { setMarathons(await getAdminMarathons(sesion.accessToken)) }
    catch (err) { setError('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  async function fetchUsers() {
    setLoading(true); setError(null)
    try { setUsers(await getAdminUsers(sesion.accessToken, userSearch)) }
    catch (err) { setError('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  async function handleConfirm(paymentId) {
    if (!window.confirm('¿Confirmar este pago?')) return
    try {
      await confirmTransfer(paymentId, sesion.accessToken)
      const transfer = transfers.find(t => t.id === paymentId)
      alert('¡Pago confirmado!')
      fetchTransfers()
      if (transfer) {
        setReceiptData({
          receiptNumber: String(transfer.id).slice(-8).toUpperCase(),
          paymentId: transfer.id,
          donor: transfer.runner,
          concept: transfer.marathon,
          amountCents: transfer.amountCents,
          currency: 'Bolivianos',
          currencySymbol: 'Bs',
          date: new Date(),
        })
      }
    } catch (err) { alert('Error: ' + err.message) }
  }

  function handleSearch() {
    setPage(1)
    fetchRegistrations()
  }

  function openNewMarathonModal() {
    setEditingMarathon(null)
    setMarathonForm({ name: '', city: '', startsAt: '', distanceMeters: '', capacity: '', priceCents: '', description: '' })
    setShowMarathonModal(true)
  }

  function openEditMarathonModal(m) {
    setEditingMarathon(m)
    setMarathonForm({
      name: m.name, city: m.city,
      startsAt: m.startsAt ? new Date(m.startsAt).toISOString().slice(0, 16) : '',
      distanceMeters: m.distanceMeters || '', capacity: m.capacity || '',
      priceCents: (m.priceCents / 100).toFixed(2), description: m.description || '',
    })
    setShowMarathonModal(true)
  }

  function handleMarathonFormChange(e) {
    const { name, value } = e.target
    setMarathonForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSaveMarathon(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        name: marathonForm.name,
        city: marathonForm.city,
        startsAt: new Date(marathonForm.startsAt).toISOString(),
        distanceMeters: parseInt(marathonForm.distanceMeters, 10),
        capacity: parseInt(marathonForm.capacity, 10),
        priceCents: Math.round(parseFloat(marathonForm.priceCents) * 100),
        description: marathonForm.description || undefined,
      }
      if (editingMarathon) {
        await updateMarathon(sesion.accessToken, editingMarathon.id, data)
        alert('Maratón actualizada')
      } else {
        await createMarathon(sesion.accessToken, data)
        alert('Maratón creada')
      }
      setShowMarathonModal(false)
      fetchMarathons()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  async function handleDeleteMarathon(m) {
    if (!window.confirm(`¿Eliminar "${m.name}"?`)) return
    try { await deleteMarathon(sesion.accessToken, m.id); alert('Eliminada'); fetchMarathons() }
    catch (err) { alert('Error: ' + err.message) }
  }

  async function handleTogglePublish(m) {
    try {
      if (m.published) { await unpublishMarathon(sesion.accessToken, m.id); alert('Despublicada') }
      else { await publishMarathon(sesion.accessToken, m.id); alert('Publicada') }
      fetchMarathons()
    } catch (err) { alert('Error: ' + err.message) }
  }

  function openQrModal(m) {
    setQrMarathon(m)
    setQrAmount((m.priceCents / 100).toFixed(2))
    setQrFile(null)
  }

  async function handleQrUpload() {
    if (!qrFile) { alert('Selecciona una imagen QR'); return }
    setQrUploading(true)
    try {
      await uploadMarathonQR(sesion.accessToken, qrMarathon.id, qrFile)
      const nuevoMonto = parseFloat(qrAmount)
      if (nuevoMonto > 0 && nuevoMonto !== qrMarathon.priceCents / 100) {
        await updateMarathon(sesion.accessToken, qrMarathon.id, { priceCents: Math.round(nuevoMonto * 100) })
      }
      alert('QR actualizado')
      setQrMarathon(null); setQrFile(null)
      fetchMarathons()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setQrUploading(false) }
  }

  async function handleDeleteUser(userId, userName) {
    if (!window.confirm(`¿Eliminar a ${userName}?`)) return
    try { await deleteUser(sesion.accessToken, userId); alert('Usuario eliminado'); fetchUsers() }
    catch (err) { alert('Error: ' + err.message) }
  }

  async function handleToggleUserRole(u) {
    const nuevoRol = u.role === 'admin' ? 'runner' : 'admin'
    if (!window.confirm(`¿Cambiar rol de ${u.name} a ${nuevoRol}?`)) return
    try { await updateUser(sesion.accessToken, u.id, { role: nuevoRol }); alert('Rol actualizado'); fetchUsers() }
    catch (err) { alert('Error: ' + err.message) }
  }

  const marathonsFiltradas = marathons.filter(m =>
    m.name.toLowerCase().includes(marathonSearch.toLowerCase()) ||
    m.city.toLowerCase().includes(marathonSearch.toLowerCase())
  )

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>Panel Administrativo</h1>
          <p>Centro de Apoyo a la Mujer · Maratón de la Mujer</p>
        </div>
      </div>

      <div className="dashboard-body container">
        <div className="dash-tabs">
          {[
            ['inscripciones', 'Inscripciones'],
            ['pagos', 'Validar cobros'],
            ['maratones', 'Maratones'],
            ['usuarios', 'Usuarios'],
          ].map(([key, label]) => (
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
              <h2>Inscripciones ({totalItems})</h2>
              <div className="dash-search-bar">
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="dash-search-input" />
                <button className="btn-outline-sm" onClick={handleSearch}>Buscar</button>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                  <option value="">Todos</option>
                  {Object.entries(ESTADO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            {registrations.length === 0 ? (
              <div className="dash-empty"><span></span><p>No hay inscripciones.</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>Corredora</th><th>CI</th><th>Celular</th><th>CAM</th><th>Donador</th><th>Maratón</th><th>Estado</th><th>Total</th><th>Recibo</th></tr></thead>
                    <tbody>
                      {registrations.map(r => (
                        <tr key={r.id}>
                          <td><div className="cell-name">{r.runner}</div><div className="cell-sub">{r.email}</div></td>
                          <td>{r.docId || '—'}</td>
                          <td>{r.phone || '—'}</td>
                          <td>{r.knowsCam === null ? '—' : r.knowsCam ? 'Sí' : 'No'}</td>
                          <td>{r.acceptsDonorCall === null ? '—' : r.acceptsDonorCall ? 'Sí' : 'No'}</td>
                          <td>{r.marathon}</td>
                          <td><span className={`status-badge ${ESTADO_CLASS[r.status] || ''}`}>{ESTADO_LABEL[r.status] || r.status}</span></td>
                          <td>{(r.totalCents / 100).toFixed(2)} Bs</td>
                          <td>
                            {r.status === 'confirmed' && (
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
                            )}
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

        {/* PAGOS */}
        {activeTab === 'pagos' && !loading && (
          <div className="dash-card">
            <div className="dash-card-header"><h2>Transferencias pendientes</h2><button className="btn-outline-sm" onClick={fetchTransfers}>Actualizar</button></div>
            {transfers.length === 0 ? <div className="dash-empty"><span></span><p>No hay pendientes.</p></div> : (
              <div className="table-wrap">
                <table className="dash-table">
                  <thead><tr><th>Corredora</th><th>CI</th><th>Celular</th><th>Maratón</th><th>Monto</th><th>Acción</th></tr></thead>
                  <tbody>
                    {transfers.map(t => (
                      <tr key={t.id}>
                        <td><div className="cell-name">{t.runner}</div><div className="cell-sub">{t.email}</div></td>
                        <td>{t.docId || '—'}</td>
                        <td>{t.phone || '—'}</td>
                        <td>{t.marathon}</td>
                        <td><strong>{(t.amountCents / 100).toFixed(2)} Bs</strong></td>
                        <td><button className="btn-primary-sm" onClick={() => handleConfirm(t.id)}>Confirmar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MARATONES */}
        {activeTab === 'maratones' && !loading && (
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>Maratones ({marathonsFiltradas.length})</h2>
              <div className="dash-search-bar">
                <input type="text" placeholder="Buscar..." value={marathonSearch} onChange={e => setMarathonSearch(e.target.value)} className="dash-search-input" />
                <button className="btn-primary-sm" onClick={openNewMarathonModal}>+ Nueva</button>
              </div>
            </div>
            {marathonsFiltradas.length === 0 ? <div className="dash-empty"><span></span><p>No hay maratones.</p></div> : (
              <div className="table-wrap">
                <table className="dash-table">
                  <thead><tr><th>Nombre</th><th>Ciudad</th><th>Fecha</th><th>Precio</th><th>Inscritos</th><th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {marathonsFiltradas.map(m => (
                      <tr key={m.id}>
                        <td><div className="cell-name">{m.name}</div><div className="cell-sub">{m.slug}</div></td>
                        <td>{m.city}</td>
                        <td>{new Date(m.startsAt).toLocaleDateString()}</td>
                        <td>{(m.priceCents / 100).toFixed(2)} Bs</td>
                        <td>{m.slotsTaken}/{m.capacity}</td>
                        <td><span className={`status-badge ${m.published ? 'badge-confirmed' : 'badge-draft'}`}>{m.published ? 'Publicada' : 'Borrador'}</span></td>
                        <td className="actions-cell">
                          <button className="btn-outline-sm" onClick={() => openEditMarathonModal(m)}>Editar</button>
                          <button className="btn-outline-sm" onClick={() => openQrModal(m)}>QR</button>
                          <button className="btn-outline-sm" onClick={() => handleTogglePublish(m)}>{m.published ? 'Ocultar' : 'Publicar'}</button>
                          <button className="btn-danger-sm" onClick={() => handleDeleteMarathon(m)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  <thead><tr><th>Nombre</th><th>Email</th><th>CI</th><th>Rol</th><th>Inscripciones</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email || '—'}</td>
                        <td>{u.ci || '—'}</td>
                        <td><span className={`status-badge ${u.role === 'admin' ? 'badge-confirmed' : 'badge-pending'}`}>{u.role}</span></td>
                        <td>{u.registrations}</td>
                        <td className="actions-cell">
                          <button className="btn-outline-sm" onClick={() => handleToggleUserRole(u)}>{u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}</button>
                          <button className="btn-danger-sm" onClick={() => handleDeleteUser(u.id, u.name)}></button>
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

      {/* MODAL MARATÓN */}
      {showMarathonModal && (
        <div className="modal-overlay" onClick={() => setShowMarathonModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMarathon ? ' Editar' : 'Nueva'} Maratón</h2>
              <button className="modal-close" onClick={() => setShowMarathonModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveMarathon}>
              <div className="modal-body">
                <label className="form-label">Nombre *<input type="text" name="name" required value={marathonForm.name} onChange={handleMarathonFormChange} className="form-input" /></label>
                <label className="form-label">Ciudad *<input type="text" name="city" required value={marathonForm.city} onChange={handleMarathonFormChange} className="form-input" /></label>
                <label className="form-label">Fecha *<input type="datetime-local" name="startsAt" required value={marathonForm.startsAt} onChange={handleMarathonFormChange} className="form-input" /></label>
                <label className="form-label">Distancia (m) *<input type="number" name="distanceMeters" required value={marathonForm.distanceMeters} onChange={handleMarathonFormChange} className="form-input" /></label>
                <label className="form-label">Capacidad *<input type="number" name="capacity" required value={marathonForm.capacity} onChange={handleMarathonFormChange} className="form-input" /></label>
                <label className="form-label">Precio (Bs) *<input type="number" name="priceCents" required step="0.01" value={marathonForm.priceCents} onChange={handleMarathonFormChange} className="form-input" /></label>
                <label className="form-label">Descripción<textarea name="description" value={marathonForm.description} onChange={handleMarathonFormChange} className="form-input" rows="3" /></label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowMarathonModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">{editingMarathon ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR */}
      {qrMarathon && (
        <div className="modal-overlay" onClick={() => setQrMarathon(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2> QR - {qrMarathon.name}</h2><button className="modal-close" onClick={() => setQrMarathon(null)}>×</button></div>
            <div className="modal-body">
              <label className="form-label">Monto (Bs):<input type="number" step="0.01" value={qrAmount} onChange={e => setQrAmount(e.target.value)} className="form-input" /></label>
              <label className="form-label">Imagen QR:<input type="file" accept="image/*" onChange={e => setQrFile(e.target.files[0])} className="form-input" /></label>
              {qrFile && <p className="file-selected">{qrFile.name}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setQrMarathon(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleQrUpload} disabled={qrUploading}>{qrUploading ? 'Subiendo...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {receiptData && (
        <DonationReceiptCanvas
          data={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  )
}
