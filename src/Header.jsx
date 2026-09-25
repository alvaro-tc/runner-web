export default function Header({ sesion, onLogout, seccion, onSeccionChange }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo-dots"><span /><span /></span>
        <strong>CAM Runners</strong>
      </div>

      {sesion ? (
        <div className="user">
          <span className="role-badge">
            {sesion.user.role === 'admin' ? 'Admin' : sesion.user.role === 'organizer' ? 'Organizador' : 'Corredor/a'}
          </span>
          <span>{sesion.user.name}</span>
          <button className="btn-logout" onClick={onLogout}>Salir</button>
        </div>
      ) : (
        <nav className="topbar-nav">
          <button
            className={`topbar-tab${seccion === 'inicio' ? ' active' : ''}`}
            onClick={() => onSeccionChange?.('inicio')}
          >
            Inicio
          </button>
          <button
            className={`topbar-tab${seccion === 'acceso' ? ' active' : ''}`}
            onClick={() => onSeccionChange?.('acceso')}
          >
            Iniciar sesión
          </button>
        </nav>
      )}
    </header>
  )
}
