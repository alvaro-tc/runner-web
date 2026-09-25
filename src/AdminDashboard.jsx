import { useState, useEffect } from 'react'
import DonationReceipt from './components/DonationReceipt'
import {
  getAdminPayments,
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
  approvePaymentProof,
  rejectPaymentProof,
  getApkInfo,
  uploadApk,
  APK_URL,
} from './api'

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

const ROL_LABEL = { runner: 'Corredora', organizer: 'Organizador', admin: 'Admin' }

const PAGE_SIZE_PAGOS = 20

export default function AdminDashboard({ sesion }) {
  const esAdmin = sesion.user.role === 'admin'
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
  const [apkInfo, setApkInfo] = useState(null)
  const [apkFile, setApkFile] = useState(null)
  const [apkUploading, setApkUploading] = useState(false)

  useEffect(() => {
    if (activeTab === 'inscripciones') fetchRegistrations()
    if (activeTab === 'maratones') fetchMarathons()
    if (activeTab === 'usuarios') fetchUsers()
    if (activeTab === 'app') getApkInfo(sesion.accessToken).then(setApkInfo).catch(e => setError(e.message))
  }, [activeTab, page])

  async function handleUploadApk(e) {
    e.preventDefault()
    if (!apkFile) return
    setApkUploading(true)
    setError(null)
    try {
      setApkInfo(await uploadApk(sesion.accessToken, apkFile))
      setApkFile(null)
      e.target.reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setApkUploading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'pagos') fetchPayments()
  }, [activeTab, payPage, payStatus, payMarathon])

  // El filtro por maratón necesita la lista; el organizador también puede leerla.
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

  async function handleChangeRole(u, nuevoRol) {
    if (!window.confirm(`¿Cambiar el rol de ${u.name} a ${ROL_LABEL[nuevoRol]}?`)) return
    try { await updateUser(sesion.accessToken, u.id, { role: nuevoRol }); fetchUsers() }
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
          <h1>{esAdmin ? 'Panel Administrativo' : 'Panel de Organizador'}</h1>
          <p>Centro de Apoyo a la Mujer · Maratón de la Mujer</p>
        </div>
      </div>

      <div className="dashboard-body container">
        <div className="dash-tabs">
          {[
            ['inscripciones', 'Inscripciones'],
            ['pagos', 'Validar cobros'],
            esAdmin && ['maratones', 'Maratones'],
            ['usuarios', 'Usuarios'],
            esAdmin && ['app', 'App Android'],
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
                    <thead><tr><th>Corredora</th><th>CI</th><th>Celular</th><th>CAM</th><th>Donador</th><th>Maratón</th><th>Dorsal</th><th>Total</th><th>Recibo</th></tr></thead>
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
                <select value={payMarathon} onChange={e => { setPayMarathon(e.target.value); setPayPage(1) }} aria-label="Maratón">
                  <option value="">Todas las maratones</option>
                  {marathons.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            {loading ? null : payments.length === 0 ? <div className="dash-empty"><span></span><p>No hay cobros con estos filtros.</p></div> : (
              <>
                <div className="table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>Corredora</th><th>CI</th><th>Celular</th><th>Maratón</th><th>Monto</th><th>Método</th><th>Estado</th><th>Validado por</th><th>Acción</th></tr></thead>
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
                  <thead><tr><th>Nombre</th><th>Email</th><th>CI</th><th>Rol</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email || '—'}</td>
                        <td>{u.ci || '—'}</td>
                        <td>
                          {esAdmin && u.id !== sesion.user.id ? (
                            <select value={u.role} onChange={e => handleChangeRole(u, e.target.value)} aria-label={`Rol de ${u.name}`}>
                              {Object.entries(ROL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                          ) : (
                            <span className={`status-badge ${u.role === 'admin' ? 'badge-confirmed' : 'badge-pending'}`}>{ROL_LABEL[u.role] || u.role}</span>
                          )}
                        </td>
                        <td className="actions-cell">
                          {esAdmin && u.id !== sesion.user.id && <button className="btn-danger-sm" onClick={() => handleDeleteUser(u.id, u.name)}>Eliminar</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* APP ANDROID */}
        {activeTab === 'app' && (
          <div className="dash-card">
            <div className="dash-card-header"><h2>App Android (.apk)</h2></div>
            <div className="modal-body">
              {apkInfo ? (
                <p>
                  Versión publicada: {(apkInfo.bytes / 1024 / 1024).toFixed(1)} MB · subida el{' '}
                  {new Date(apkInfo.uploadedAt).toLocaleString('es-BO')}
                </p>
              ) : (
                <p>Aún no se subió ningún APK.</p>
              )}
              <p>Enlace de descarga (el del QR de la página): <a href={APK_URL}>{APK_URL}</a></p>
              <form onSubmit={handleUploadApk}>
                <label className="form-label">
                  Nueva versión
                  <input type="file" accept=".apk,application/vnd.android.package-archive" required onChange={e => setApkFile(e.target.files[0] || null)} className="form-input" />
                </label>
                <button type="submit" className="btn-primary" disabled={!apkFile || apkUploading}>
                  {apkUploading ? 'Subiendo…' : 'Subir y reemplazar'}
                </button>
              </form>
            </div>
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
                  <dt>Maratón</dt><dd>{selectedPayment.marathon}</dd>
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
