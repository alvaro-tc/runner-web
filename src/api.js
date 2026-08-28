/// En produccion la API vive en el MISMO dominio que la web (Caddy manda
/// /api/v1 a Node), asi que el valor por defecto es una ruta relativa: dejar
/// aqui `http://localhost:3000` significaba que el sitio publicado intentaba
/// llamar al portatil de quien compilo —el navegador ademas lo bloquea por
/// contenido mixto— y el login no llegaba a salir nunca.
/// `VITE_API_BASE_URL` sigue mandando cuando la API esta en otro dominio.
const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '/api/v1')

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
  const headers = { 'Content-Type': 'application/json', ...(fetchOptions.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...fetchOptions, headers })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message || `Error ${res.status}`)
  return json.data
}

/// `identifier` es email **o** CI: la API decide cual es por el `@` y expone un
/// solo campo. Mandar `email` devolvia 400 —el ValidationPipe rechaza campos
/// que no estan en el DTO— y el formulario mostraba "La peticion no paso la
/// validacion" con cualquier contrasena, correcta o no.
export async function login(identifier, password) {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, deviceId: deviceId() }),
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
  return fetchApi('/marathons')
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
  // Paso 3: Pagar (usamos bank_transfer para probar la validación manual)
  // El backend exige Idempotency-Key en los cobros para no duplicarlos si el pedido se reintenta.
  return fetchApi(`/registrations/${registrationId}/checkout`, {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ termsAccepted: true, method: 'bank_transfer' }),
    token
  })
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

/// Solicitud publica (sin sesion) de borrado de cuenta desde la web.
/// El backend responde con un correo de verificacion: la cuenta solo se borra
/// cuando el usuario confirma el enlace, para que nadie pueda pedir el borrado
/// de una cuenta ajena.
///
/// No distingue si la cuenta existe: un 404 se trata como exito para no
/// convertir el formulario en un detector de correos registrados.
export async function requestAccountDeletion(email, reason) {
  const res = await fetch(`${BASE}/account-deletion-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, reason: reason || undefined }),
  })

  if (res.status === 404) return { ok: true }
  if (res.ok) return { ok: true }

  // El endpoint es publico y puede responder sin cuerpo JSON (proxy, 502, HTML).
  let message = `Error ${res.status}`
  try {
    const json = await res.json()
    message = json?.error?.message || message
  } catch {
    // Sin cuerpo JSON: nos quedamos con el codigo de estado.
  }
  throw new Error(message)
}

export { BASE }
