import { useState } from 'react'
import { requestAccountDeletion } from './api'

export default function EliminarCuenta() {
  const [email, setEmail] = useState('')
  const [motivo, setMotivo] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await requestAccountDeletion(email.trim(), motivo.trim())
      setEnviado(true)
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <article className="legal">
      <header className="legal-head">
        <span className="eyebrow">CamRun</span>
        <h1>Eliminar tu cuenta de CamRun</h1>
        <p className="legal-lead">
          Puedes borrar tu cuenta de CamRun y todos tus datos cuando quieras. La forma más
          rápida es hacerlo desde la propia aplicación; si ya no la tienes instalada, usa el
          formulario de esta página.
        </p>
      </header>

      <section aria-labelledby="desde-la-app">
        <h2 id="desde-la-app">1. Cómo borrarla desde la app (vía preferente)</h2>
        <ol>
          <li>Abre CamRun.</li>
          <li>Ve a <em>Perfil &gt; Ajustes &gt; Cuenta &gt; Eliminar cuenta</em>.</li>
          <li>Confirma con tu contraseña.</li>
        </ol>
        <p>
          El borrado es <strong>inmediato e irreversible</strong>: no podremos recuperar tu
          cuenta ni tus salidas después.
        </p>
      </section>

      <section aria-labelledby="formulario-web">
        <h2 id="formulario-web">2. Formulario web</h2>
        <p>
          Si ya no tienes la aplicación instalada, pide el borrado desde aquí. Te enviaremos
          un <strong>correo de verificación</strong> a esa dirección y solo borraremos la
          cuenta cuando confirmes el enlace, para que nadie pueda pedir el borrado de una
          cuenta ajena. El plazo máximo de tramitación es de <strong>30 días</strong>.
        </p>

        <div className="legal-form">
          {enviado ? (
            <div role="status">
              <h3>Solicitud recibida</h3>
              <p>
                Si existe una cuenta asociada a <strong>{email}</strong>, te hemos enviado un
                correo con un enlace de verificación. La cuenta se borrará cuando confirmes
                ese enlace. Revisa también la carpeta de spam.
              </p>
            </div>
          ) : (
            <form onSubmit={enviar}>
              <h3>Solicitar eliminación de cuenta</h3>

              <label htmlFor="del-email">
                Correo de la cuenta
                <input
                  id="del-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                />
              </label>

              <label htmlFor="del-motivo">
                Motivo (opcional)
                <textarea
                  id="del-motivo"
                  name="motivo"
                  rows={4}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Cuéntanos por qué te vas, si quieres."
                />
              </label>

              <label className="check-row" htmlFor="del-confirm">
                <input
                  id="del-confirm"
                  name="confirmacion"
                  type="checkbox"
                  required
                  checked={confirmado}
                  onChange={(e) => setConfirmado(e.target.checked)}
                />
                <span>Entiendo que esta acción es irreversible y que perderé todos mis datos.</span>
              </label>

              {error && <p className="error" role="alert">{error}</p>}

              <button type="submit" disabled={enviando || !confirmado}>
                {enviando ? 'Enviando…' : 'Solicitar eliminación'}
              </button>

              <p className="hint">
                ¿Problemas con el formulario? Escríbenos a{' '}
                <a href="mailto:alvarocallet@gmail.com">alvarocallet@gmail.com</a>.
              </p>
            </form>
          )}
        </div>
      </section>

      <section aria-labelledby="que-se-borra">
        <h2 id="que-se-borra">3. Qué se borra y qué se conserva</h2>

        <h3>Qué se borra</h3>
        <ul>
          <li>Tu perfil y tus datos de cuenta.</li>
          <li>Tus salidas y rutas.</li>
          <li>Tu plan de entrenamiento.</li>
          <li>Tus inscripciones a carreras.</li>
          <li>Tu foto de perfil.</li>
        </ul>

        <h3>Qué se conserva y por qué</h3>
        <p>
          Se conservan los <strong>registros contables de los pagos ya realizados</strong>,
          que el organizador debe guardar por obligación legal. Esos registros quedan{' '}
          <strong>desvinculados de tu cuenta</strong>.
        </p>
      </section>

      <section aria-labelledby="mas-info">
        <h2 id="mas-info">Más información</h2>
        <p>
          Puedes consultar cómo tratamos tus datos en la{' '}
          <a href="/privacidad">Política de privacidad de CamRun</a>.
        </p>
      </section>
    </article>
  )
}
