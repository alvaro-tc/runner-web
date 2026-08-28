/// Pie sobrio para las paginas legales. No reutiliza el pie de la portada
/// (src/components/Footer.jsx) porque aquel va sobre fondo oscuro y arrastra
/// navegacion de la landing que aqui no aplica.
export default function Footer() {
  return (
    <footer className="legal-footer">
      <nav className="legal-footer-links" aria-label="Enlaces legales">
        <a href="/">Inicio</a>
        <a href="/privacidad">Política de privacidad</a>
        <a href="/eliminar-cuenta">Eliminar tu cuenta</a>
        <a href="mailto:alvarocallet@gmail.com">alvarocallet@gmail.com</a>
      </nav>
      <p className="legal-footer-note">CAM Runners · CamRun</p>
    </footer>
  )
}
