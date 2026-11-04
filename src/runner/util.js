export const bs = (cents, currency = 'BOB') =>
  `${currency === 'BOB' ? 'Bs' : currency} ${((cents || 0) / 100).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const fecha = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Date(iso).toLocaleDateString('es-BO', opts) : '—'

export const hora = iso => (iso ? new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '')

export const km = m => `${((m || 0) / 1000).toLocaleString('es-BO', { maximumFractionDigits: 1 })} km`

export function duracion(s) {
  if (s == null) return '—'
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.floor(s % 60)
  const p = n => String(n).padStart(2, '0')
  return h ? `${h}:${p(m)}:${p(x)}` : `${m}:${p(x)}`
}

export const ritmo = s => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')} /km` : '—')

// Lo que queda hasta una fecha, en partes para la cuenta regresiva
export function faltan(iso, ahora = Date.now()) {
  const d = Math.max(0, new Date(iso).getTime() - ahora)
  return { total: d, dias: Math.floor(d / 864e5), horas: Math.floor(d / 36e5) % 24, min: Math.floor(d / 6e4) % 60, seg: Math.floor(d / 1e3) % 60 }
}

export const ESTADO_INSCRIPCION = {
  draft: { label: 'Borrador', tono: 'neutral' },
  pending_payment: { label: 'Pago pendiente', tono: 'warn' },
  confirmed: { label: 'Confirmada', tono: 'ok' },
  cancelled: { label: 'Cancelada', tono: 'bad' },
  refunded: { label: 'Reembolsada', tono: 'bad' },
}

export const ESTADO_CARRERA = {
  open: { label: 'Inscripciones abiertas', tono: 'ok' },
  closing_soon: { label: 'Últimos cupos', tono: 'warn' },
  full: { label: 'Cupos agotados', tono: 'bad' },
  closed: { label: 'Inscripciones cerradas', tono: 'neutral' },
}

export const puedeInscribirse = m => m.registrationStatus === 'open' || m.registrationStatus === 'closing_soon'
