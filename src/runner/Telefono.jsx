import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/AdminCharts'

// Copia de PhoneField (app movil): Bolivia primero y luego los paises de los
// que llega gente a correr. El valor es "codigo numero" ("+591 70000000"),
// asi quien lo usa no sabe que hay un selector detras.
const PAISES = [
  ['bo', '+591', 'Bolivia'], ['ar', '+54', 'Argentina'], ['br', '+55', 'Brasil'], ['cl', '+56', 'Chile'],
  ['co', '+57', 'Colombia'], ['ec', '+593', 'Ecuador'], ['es', '+34', 'España'], ['us', '+1', 'Estados Unidos'],
  ['mx', '+52', 'México'], ['py', '+595', 'Paraguay'], ['pe', '+51', 'Perú'], ['uy', '+598', 'Uruguay'], ['ve', '+58', 'Venezuela'],
]

// Las banderas emoji no se dibujan en Windows (salen las letras): van como imagen
const Bandera = ({ iso }) => <img className="rn-flag" src={`https://flagcdn.com/${iso}.svg`} alt="" width="24" height="18" loading="lazy" />

function partir(texto = '') {
  const limpio = texto.trim()
  // El codigo mas largo primero: "+593" no debe leerse como "+5..."
  const pais = [...PAISES].sort((a, b) => b[1].length - a[1].length).find(p => limpio.startsWith(p[1]))
  return pais ? [pais, limpio.slice(pais[1].length).trim()] : [PAISES[0], limpio.replace(/^\+/, '')]
}

export default function Telefono({ value, onChange, id, required }) {
  const [[iso, codigo, nombre], numero] = partir(value)
  const [abierto, setAbierto] = useState(false)
  const caja = useRef(null)
  const boton = useRef(null)

  useEffect(() => {
    if (!abierto) return
    caja.current?.querySelector('[aria-selected="true"]')?.focus()
    const fuera = e => !caja.current?.contains(e.target) && setAbierto(false)
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  const emitir = (cod, num) => onChange(`${cod} ${num}`.trim())

  function teclas(e) {
    const opciones = [...caja.current.querySelectorAll('[role="option"]')]
    const i = opciones.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); opciones[Math.min(i + 1, opciones.length - 1)]?.focus() }
    if (e.key === 'ArrowUp') { e.preventDefault(); opciones[Math.max(i - 1, 0)]?.focus() }
    if (e.key === 'Escape') { e.stopPropagation(); setAbierto(false); boton.current?.focus() }
  }

  return (
    <div className="rn-phone-field" ref={caja}>
      <button type="button" ref={boton} className="rn-phone-country" onClick={() => setAbierto(!abierto)}
        aria-haspopup="listbox" aria-expanded={abierto} aria-label={`País: ${nombre} ${codigo}. Cambiar`}>
        <Bandera iso={iso} /><span>{codigo}</span><Icon name="chevron" size={16} />
      </button>
      <input id={id} type="tel" inputMode="numeric" autoComplete="tel-national" required={required} maxLength={20}
        value={numero} placeholder="70000000" onChange={e => emitir(codigo, e.target.value.replace(/\D/g, ''))} />
      {abierto && (
        <ul className="rn-phone-list" role="listbox" aria-label="Código de país" onKeyDown={teclas}>
          {PAISES.map(([i, c, n]) => (
            <li key={i}>
              <button type="button" role="option" aria-selected={i === iso}
                onClick={() => { emitir(c, numero); setAbierto(false); boton.current?.focus() }}>
                <Bandera iso={i} /><span className="rn-phone-name">{n}</span><span className="rn-phone-code">{c}</span>
                {i === iso && <Icon name="check" size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
