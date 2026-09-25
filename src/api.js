const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

/// El backend exige un deviceId por sesion; se guarda para no abrir una nueva
/// sesion de dispositivo en cada login.
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
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message || `Error ${res.status}`)
  return json.data
}

export async function login(email, password) {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, deviceId: deviceId() }),
  })
}

export async function register(name, email, password) {
  return fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, deviceId: deviceId() }),
  })
}

export async function getMe(token) {
  return fetchApi('/users/me', { token })
}

export async function getMarathons() {
  const result = await fetchApi('/marathons')
  return Array.isArray(result) ? result : result.items || []
}

export async function createRegistration(marathonId, personalData, token) {
  // Paso 1: Crear borrador
  const reg = await fetchApi('/registrations', {
    method: 'POST',
    body: JSON.stringify({ marathonId, personalData }),
    token
  })

  // Paso 2: si la maratón tiene categorías, el checkout las exige. Por ahora
  // se elige la primera automáticamente; elegirla a mano queda para cuando
  // el formulario sume más campos.
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

export async function getAdminRegistrations(token, status) {
  const query = status ? `?status=${status}` : ''
  return fetchApi(`/admin/registrations${query}`, { token })
}

export async function confirmTransfer(paymentId, token) {
  return fetchApi(`/admin/payments/${paymentId}/confirm-transfer`, {
    method: 'POST',
    token
  })
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
