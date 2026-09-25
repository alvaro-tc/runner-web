const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '/api/v1')

function deviceId() {
  let id = localStorage.getItem('auth.deviceId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('auth.deviceId', id)
  }
  return id
}

async function fetchApi(path, options = {}) {
  const { token, ...fetchOptions } = options
  const headers = { ...(fetchOptions.headers || {}) }
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...fetchOptions, headers })
  if (res.status === 204) return null
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message || `Error ${res.status}`)
  return json.data
}

// AUTH
export async function login(identifier, password) {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, deviceId: deviceId() }),
  })
}

export async function register(name, email, password, ci) {
  return fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, ci, deviceId: deviceId() }),
  })
}

export async function getMe(token) {
  return fetchApi('/users/me', { token })
}

// MARATONES PÚBLICAS
export async function getMarathons() {
  const result = await fetchApi('/marathons')
  return Array.isArray(result) ? result : result.items || []
}

// INSCRIPCIONES
export async function createRegistration(marathonId, personalData, token) {
  const reg = await fetchApi('/registrations', {
    method: 'POST',
    body: JSON.stringify({ marathonId, personalData }),
    token
  })
  const categorias = await fetchApi(`/marathons/${marathonId}/categories`)
  if (categorias.length > 0) {
    await fetchApi(`/registrations/${reg.id}/category-extras`, {
      method: 'PATCH',
      body: JSON.stringify({ categoryId: categorias[0].id }),
      token,
    })
  }
  return reg
}

export async function checkoutRegistration(registrationId, token) {
  // Paso 3: Abrir el cobro QR manual. La confirmación llegará después de que
  // un organizador revise el comprobante subido por el corredor.
  // El backend exige Idempotency-Key en los cobros para no duplicarlos si el pedido se reintenta.
  const storageKey = `payment.idempotency.${registrationId}`
  const idempotencyKey = sessionStorage.getItem(storageKey) || crypto.randomUUID()
  sessionStorage.setItem(storageKey, idempotencyKey)

  return fetchApi(`/registrations/${registrationId}/checkout`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ termsAccepted: true, method: 'qr_manual' }),
    token
  })
}

export async function getPayment(paymentId, token) {
  return fetchApi(`/payments/${paymentId}`, { token })
}

export async function uploadPaymentProof(paymentId, file, reference, token) {
  const body = new FormData()
  body.append('file', file)
  if (reference?.trim()) body.append('reference', reference.trim())

  return fetchApi(`/payments/${paymentId}/proof`, {
    method: 'POST',
    body,
    token,
  })
}

export async function getPaymentReceipt(paymentId, token) {
  return fetchApi(`/payments/${paymentId}/receipt`, { token })
}

export async function getPendingTransfers(token) {
  return fetchApi('/admin/payments/pending-transfers', { token })
}

export async function confirmTransfer(paymentId, token) {
  return fetchApi(`/admin/payments/${paymentId}/confirm-transfer`, {
    method: 'POST',
    body: JSON.stringify({}),
    token,
  })
}

// ADMIN: INSCRIPCIONES
export async function getAdminRegistrations(token, { status = '', search = '', page = 1, limit = 40 } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  params.append('page', page)
  params.append('limit', limit)
  return fetchApi(`/admin/registrations?${params}`, { token })
}

// ADMIN: MARATONES
export async function getAdminMarathons(token) {
  return fetchApi('/admin/marathons', { token })
}

export async function getAdminMarathon(token, marathonId) {
  return fetchApi(`/admin/marathons/${marathonId}`, { token })
}

export async function createMarathon(token, data) {
  return fetchApi('/admin/marathons', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  })
}

export async function updateMarathon(token, marathonId, data) {
  return fetchApi(`/admin/marathons/${marathonId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  })
}

export async function deleteMarathon(token, marathonId) {
  return fetchApi(`/admin/marathons/${marathonId}`, {
    method: 'DELETE',
    token,
  })
}

export async function uploadMarathonQR(token, marathonId, file) {
  const formData = new FormData()
  formData.append('file', file)
  return fetchApi(`/admin/marathons/${marathonId}/qr`, {
    method: 'POST',
    body: formData,
    token,
  })
}

export async function publishMarathon(token, marathonId) {
  return fetchApi(`/admin/marathons/${marathonId}/publish`, {
    method: 'POST',
    token,
  })
}

export async function unpublishMarathon(token, marathonId) {
  return fetchApi(`/admin/marathons/${marathonId}/unpublish`, {
    method: 'POST',
    token,
  })
}

// ADMIN: USUARIOS
export async function getAdminUsers(token, search) {
  const query = search ? `?q=${encodeURIComponent(search)}` : ''
  return fetchApi(`/admin/users${query}`, { token })
}

export async function createUser(token, data) {
  return fetchApi('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  })
}

export async function updateUser(token, userId, data) {
  return fetchApi(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  })
}

export async function deleteUser(token, userId) {
  return fetchApi(`/admin/users/${userId}`, {
    method: 'DELETE',
    token,
  })
}

// ELIMINAR CUENTA
export async function requestAccountDeletion(email, reason) {
  const res = await fetch(`${BASE}/account-deletion-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, reason: reason || undefined }),
  })
  if (res.status === 404) return { ok: true }
  if (res.ok) return { ok: true }
  let message = `Error ${res.status}`
  try {
    const json = await res.json()
    message = json?.error?.message || message
  } catch {}
  throw new Error(message)
}

export async function getPaymentProofs(token) {
  return fetchApi('/admin/payment-proofs', { token })
}

export async function approvePaymentProof(proofId, note, token) {
  return fetchApi(`/admin/payment-proofs/${proofId}/approve`, {
    method: 'POST',
    body: JSON.stringify(note?.trim() ? { note: note.trim() } : {}),
    token,
  })
}

export async function rejectPaymentProof(proofId, note, token) {
  return fetchApi(`/admin/payment-proofs/${proofId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ note: note.trim() }),
    token,
  })
}

export { BASE }
