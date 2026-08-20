const BASE = import.meta.env.VITE_API_BASE_URL || 'https://runner-app.tumype.com/api/v1'

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

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, deviceId: deviceId() }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message || `Error ${res.status}`)
  return json.data
}

export { BASE }
