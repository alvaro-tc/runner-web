import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Privacidad from './Privacidad.jsx'
import Terminos from './Terminos.jsx'
import EliminarCuenta from './EliminarCuenta.jsx'
import Footer from './Footer.jsx'
import './index.css'

/// Las paginas legales son entradas HTML propias (privacidad/, terminos/, eliminar-cuenta/)
/// que comparten este bundle, asi que elegimos el componente por la ruta.
/// Se normaliza la barra final para que /privacidad y /privacidad/ coincidan.
function paginaLegal() {
  const ruta = window.location.pathname.replace(/\/+$/, '')
  if (ruta.endsWith('/privacidad')) return <Privacidad />
  if (ruta.endsWith('/terminos')) return <Terminos />
  if (ruta.endsWith('/eliminar-cuenta')) return <EliminarCuenta />
  return null
}

const legal = paginaLegal()

/// En celular las tablas de los paneles se muestran como tarjetas (ver .dash-table en index.css).
/// Cada celda necesita el título de su columna, así que se copia del thead cuando React pinta filas.
new MutationObserver(() => {
  for (const tabla of document.querySelectorAll('.dash-table')) {
    const titulos = [...tabla.querySelectorAll('thead th')].map(th => th.textContent)
    for (const fila of tabla.querySelectorAll('tbody tr')) {
      fila.querySelectorAll(':scope > td').forEach((td, i) => {
        if (titulos[i] && td.dataset.label !== titulos[i]) td.dataset.label = titulos[i]
      })
    }
  }
}).observe(document.getElementById('root'), { childList: true, subtree: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {legal ? (
      <div className="page">
        <header className="legal-top"><a href="/"><img src="/logo.png" alt="" />CAM RUN</a></header>
        <main className="legal-page">{legal}</main>
        <Footer />
      </div>
    ) : (
      <App />
    )}
  </StrictMode>,
)
