import { useEffect, useRef, useState } from 'react'
import { Icon } from './components/AdminCharts'
import { changePassword, getMe, removeAvatar, updateMe, uploadAvatar } from './api'
import { etiquetaRol } from './roles'

const REGLAS = [
  ['8 caracteres o más', v => v.length >= 8],
  ['Al menos una letra', v => /[A-Za-z]/.test(v)],
  ['Al menos un número', v => /\d/.test(v)],
]
const iniciales = n => (n || '?').split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
const desdeMe = m => ({ name: m.name || '', email: m.email || '', phone: m.profile?.phone || '', city: m.profile?.city || '' })
const msgStyle = e => ({ margin: '1rem 0 0', color: e.bad ? 'var(--ad-danger)' : undefined })

// Perfil propio para cualquier rol del equipo: foto, datos y contraseña (mismos endpoints que el corredor).
export default function PanelPerfil({ sesion, onMe }) {
  const token = sesion.accessToken
  const [me, setMe] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { getMe(token).then(m => { setMe(m); onMe?.(m) }, e => setError(e.message)) }, [])
  const actualizar = fn => setMe(m => { const n = fn(m); onMe?.(n); return n })

  if (!me) return error ? <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p> : <div className="ad-loading"><span className="ad-spinner" /> Cargando…</div>

  return (
    <div className="ad-mod">
      <header className="ad-head">
        <div>
          <p className="ad-eyebrow">Mi cuenta</p>
          <h1>Mi perfil</h1>
          <p className="ad-head-meta">Actualizá tu foto, tus datos y tu contraseña.</p>
        </div>
      </header>
      <Foto me={me} token={token} setMe={actualizar} />
      <Datos me={me} token={token} onGuardado={m => actualizar(() => m)} />
      <Clave token={token} obligatoria={me.mustChangePassword} onCambiada={() => actualizar(m => ({ ...m, mustChangePassword: false }))} />
    </div>
  )
}

function Foto({ me, token, setMe }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const url = me.profile?.avatarUrl

  async function run(fn, ok) {
    setBusy(true); setMsg(null)
    try { await fn(); setMsg({ t: ok }) } catch (e) { setMsg({ bad: true, t: e.message }) }
    setBusy(false)
  }
  const subir = file => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return setMsg({ bad: true, t: 'La foto pesa más de 5 MB.' })
    run(async () => { const { avatarUrl } = await uploadAvatar(file, token); setMe(m => ({ ...m, profile: { ...m.profile, avatarUrl } })) }, 'Foto actualizada.')
  }
  const quitar = () => run(async () => { await removeAvatar(token); setMe(m => ({ ...m, profile: { ...m.profile, avatarUrl: null } })) }, 'Foto quitada.')

  return (
    <section className="ad-card">
      <div className="ad-person" style={{ gap: '1.1rem', flexWrap: 'wrap' }}>
        {url
          ? <img src={url} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover' }} />
          : <span className="ad-avatar" style={{ width: 88, height: 88, fontSize: '1.5rem' }} aria-hidden="true">{iniciales(me.name)}</span>}
        <div style={{ flex: 1, minWidth: 200 }}>
          <strong style={{ fontSize: '1.1rem' }}>{me.name}</strong>
          <p className="ad-hint" style={{ margin: '.15rem 0 .6rem' }}>{me.email} · {etiquetaRol(me.role)}</p>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button className="ad-btn is-sm" onClick={() => input.current?.click()} disabled={busy}><Icon name="camera" size={16} />{url ? 'Cambiar foto' : 'Subir foto'}</button>
            {url && <button className="ad-btn is-sm is-danger" onClick={quitar} disabled={busy}><Icon name="trash" size={16} />Quitar</button>}
          </div>
          <input ref={input} type="file" accept="image/*" hidden onChange={e => { subir(e.target.files?.[0]); e.target.value = '' }} />
          {msg && <p className="ad-hint" role="status" style={{ ...msgStyle(msg), margin: '.6rem 0 0' }}>{msg.t}</p>}
        </div>
      </div>
    </section>
  )
}

function Datos({ me, token, onGuardado }) {
  const base = desdeMe(me)
  const [f, setF] = useState(base)
  const [estado, setEstado] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const cambios = Object.keys(f).filter(k => f[k] !== base[k])

  async function submit(e) {
    e.preventDefault()
    const cuerpo = {}
    for (const k of cambios) cuerpo[k] = k === 'phone' || k === 'city' ? (f[k].trim() || null) : f[k].trim()
    setBusy(true); setEstado(null)
    try {
      const m = await updateMe(cuerpo, token)
      onGuardado(m); setF(desdeMe(m))
      try { // la barra lateral lee el nombre de la sesion guardada
        const s = JSON.parse(localStorage.getItem('auth.sesion'))
        if (s?.user) localStorage.setItem('auth.sesion', JSON.stringify({ ...s, user: { ...s.user, name: m.name, email: m.email } }))
      } catch {}
      setEstado({ t: cuerpo.email ? 'Datos guardados. Revisá tu correo nuevo para verificarlo.' : 'Datos guardados.' })
    } catch (err) { setEstado({ bad: true, t: err.message }) }
    setBusy(false)
  }

  return (
    <form className="ad-card" onSubmit={submit}>
      <header className="ad-card-head"><div><h2><Icon name="user" size={18} />Datos personales</h2></div></header>
      <div className="ad-grid">
        <label className="ad-field"><span>Nombre completo</span><input required maxLength={120} value={f.name} onChange={set('name')} autoComplete="name" /></label>
        <label className="ad-field"><span>Correo</span><input type="email" required maxLength={254} value={f.email} onChange={set('email')} autoComplete="email" />
          {f.email !== base.email && <small>Al cambiarlo tendrás que verificar el correo nuevo.</small>}</label>
        <label className="ad-field"><span>Celular</span><input type="tel" maxLength={40} value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="+591 70000000" /></label>
        <label className="ad-field"><span>Ciudad</span><input maxLength={120} value={f.city} onChange={set('city')} autoComplete="address-level2" /></label>
      </div>
      {estado && <p className="ad-hint" role="status" style={msgStyle(estado)}>{estado.t}</p>}
      <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1.1rem' }}>
        {cambios.length > 0 && <button type="button" className="ad-btn" onClick={() => setF(base)}>Descartar</button>}
        <button className="ad-btn is-primary" disabled={!cambios.length || busy}><Icon name="check" size={16} />Guardar cambios</button>
      </div>
    </form>
  )
}

function Clave({ token, obligatoria, onCambiada }) {
  const [f, setF] = useState({ actual: '', nueva: '', repetir: '' })
  const [ver, setVer] = useState(false)
  const [estado, setEstado] = useState(null)
  const [busy, setBusy] = useState(false)
  const ok = REGLAS.every(([, t]) => t(f.nueva))
  const coincide = f.nueva && f.nueva === f.repetir
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const tipo = ver ? 'text' : 'password'

  async function submit(e) {
    e.preventDefault()
    if (!ok || !coincide) return
    setBusy(true); setEstado(null)
    try {
      await changePassword(f.actual, f.nueva, token)
      setF({ actual: '', nueva: '', repetir: '' })
      setEstado({ t: 'Listo: tu contraseña cambió y cerramos tus otras sesiones.' })
      onCambiada()
      try {
        const s = JSON.parse(localStorage.getItem('auth.sesion'))
        if (s?.user) localStorage.setItem('auth.sesion', JSON.stringify({ ...s, user: { ...s.user, mustChangePassword: false } }))
      } catch {}
    } catch (err) { setEstado({ bad: true, t: err.message }) }
    setBusy(false)
  }

  return (
    <form className="ad-card" onSubmit={submit}>
      <header className="ad-card-head"><div><h2><Icon name="lock" size={18} />Cambiar contraseña</h2>
        {obligatoria && <p>Tu contraseña es temporal: elegí una nueva.</p>}</div></header>
      <div className="ad-grid">
        <label className="ad-field is-span"><span>Contraseña actual</span><input type={tipo} required value={f.actual} onChange={set('actual')} autoComplete="current-password" /></label>
        <label className="ad-field"><span>Nueva contraseña</span>
          <span className="ad-pass">
            <input type={tipo} required value={f.nueva} onChange={set('nueva')} autoComplete="new-password" />
            <button type="button" className="ad-icon-btn" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}><Icon name={ver ? 'eyeOff' : 'eye'} size={16} /></button>
          </span>
          <small>{REGLAS.map(([t, fn]) => `${fn(f.nueva) ? '✓' : '•'} ${t}`).join('  ')}</small>
        </label>
        <label className="ad-field"><span>Repetir nueva contraseña</span>
          <input type={tipo} required value={f.repetir} onChange={set('repetir')} autoComplete="new-password" aria-invalid={f.repetir && !coincide ? 'true' : undefined} />
          {f.repetir && !coincide && <small style={{ color: 'var(--ad-danger)' }}>No coincide con la nueva.</small>}</label>
      </div>
      {estado && <p className="ad-hint" role="status" style={msgStyle(estado)}>{estado.t}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.1rem' }}>
        <button className="ad-btn is-primary" disabled={!ok || !coincide || !f.actual || busy}><Icon name="key" size={16} />Guardar contraseña</button>
      </div>
    </form>
  )
}
