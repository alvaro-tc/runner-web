import { useState, useEffect } from 'react'
import {
  approvePaymentProof,
  confirmTransfer,
  getAdminRegistrations,
  getPaymentProofs,
  getPendingTransfers,
  rejectPaymentProof,
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
  const [proofs, setProofs] = useState([])
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
    if (activeTab === 'organizador') {
      fetchTransfers()
    }
    if (activeTab === 'comprobantes') {
      fetchProofs()
    }
    if (activeTab === 'inscripciones') {
      fetchRegistrations()
    }
  }, [activeTab, statusFilter])


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

  async function fetchProofs() {
    setLoading(true)
    setError(null)
    try {
      setProofs(await getPaymentProofs(sesion.accessToken))
    } catch (err) {
      setError('Error cargando comprobantes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(proofId) {
    if (!window.confirm('¿Confirmar que este pago fue recibido?')) return
    try {
      await approvePaymentProof(proofId, '', sesion.accessToken)
      fetchProofs()
    } catch (err) {
      alert('Error aprobando comprobante: ' + err.message)
    }
  }

  async function handleReject(proofId) {
    const note = window.prompt('Indica el motivo del rechazo:')
    if (!note?.trim()) return
    try {
      await rejectPaymentProof(proofId, note, sesion.accessToken)
      fetchProofs()
    } catch (err) {
      alert('Error rechazando comprobante: ' + err.message)
    }
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

      <div className="tabs">
        <button className={`tab${activeTab === 'organizador' ? ' active' : ''}`} onClick={() => setActiveTab('organizador')}>
          Validar cobros
        </button>
        <button className={`tab${activeTab === 'comprobantes' ? ' active' : ''}`} onClick={() => setActiveTab('comprobantes')}>
          Comprobantes QR
        </button>
        <button className={`tab${activeTab === 'inscripciones' ? ' active' : ''}`} onClick={() => setActiveTab('inscripciones')}>
          Inscripciones
        </button>
        <button className={`tab${activeTab === 'admin' ? ' active' : ''}`} onClick={() => setActiveTab('admin')}>
          Configuraciones
        </button>
      </div>

      {activeTab === 'comprobantes' && (
        <div className="card">
          <div className="panel-header">
            <h3>Comprobantes pendientes de revisión</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchProofs}>Actualizar</button>
          </div>
          {error && <p className="error">{error}</p>}
          {loading ? <p>Cargando...</p> : proofs.length === 0 ? (
            <div className="state-card"><div className="state-icon">✨</div><p>No hay comprobantes pendientes.</p></div>
          ) : (
            <div className="proof-grid">
              {proofs.map((proof) => (
                <article className="proof-review" key={proof.id}>
                  <a href={proof.imageUrl} target="_blank" rel="noreferrer">
                    <img src={proof.imageUrl} alt={`Comprobante de ${proof.runner}`} />
                  </a>
                  <div className="proof-review-body">
                    <h4>{proof.runner}</h4>
                    <p>{proof.marathon}</p>
                    <p><strong>Monto:</strong> {(proof.amountCents / 100).toFixed(2)} {proof.currency}</p>
                    <p><strong>Referencia:</strong> {proof.reference || 'No indicada'}</p>
                    <div className="proof-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleApprove(proof.id)}>Aprobar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(proof.id)}>Rechazar</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'organizador' && (
        <div className="card">
          <div className="panel-header">
            <h3>Transferencias pendientes</h3>
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
