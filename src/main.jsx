import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Privacidad from './Privacidad.jsx'
import EliminarCuenta from './EliminarCuenta.jsx'
import Footer from './Footer.jsx'
import './index.css'

/// Las paginas legales son entradas HTML propias (privacidad/, eliminar-cuenta/)
/// que comparten este bundle, asi que elegimos el componente por la ruta.
/// Se normaliza la barra final para que /privacidad y /privacidad/ coincidan.
function paginaLegal() {
  const ruta = window.location.pathname.replace(/\/+$/, '')
  if (ruta.endsWith('/privacidad')) return <Privacidad />
  if (ruta.endsWith('/eliminar-cuenta')) return <EliminarCuenta />
  return null
}

const legal = paginaLegal()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {legal ? (
      <div className="page">
        <main className="legal-page">{legal}</main>
        <Footer />
      </div>
    ) : (
      <App />
    )}
  </StrictMode>,
)
