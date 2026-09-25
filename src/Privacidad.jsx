export default function Privacidad() {
  return (
    <article className="legal">
      <header className="legal-head">
        <span className="eyebrow">CamRun</span>
        <h1>Política de privacidad de CamRun</h1>
        <p className="legal-date">
          Última actualización: <time dateTime="2026-08-28">28 de agosto de 2026</time>
        </p>
        <p className="legal-lead">
          Esta página explica, con lenguaje claro, qué datos recoge CamRun, para qué los
          usamos y qué puedes hacer con ellos. CamRun recoge <strong>datos de tu cuenta</strong> y
          tu <strong>ubicación precisa (GPS)</strong> mientras grabas una salida o participas en
          una carrera con seguimiento en vivo.
        </p>
      </header>

      <section aria-labelledby="quienes-somos">
        <h2 id="quienes-somos">1. Quiénes somos y cómo contactarnos</h2>
        <p>
          CamRun es una aplicación de running disponible para Android, iOS y web. Con ella
          puedes grabar tus salidas, seguir un plan de entrenamiento e inscribirte en las
          carreras que organizamos.
        </p>
        <p>
          Para cualquier duda o solicitud sobre privacidad, escríbenos a{' '}
          <a href="mailto:alvarocallet@gmail.com">alvarocallet@gmail.com</a>.
        </p>
      </section>

      <section aria-labelledby="que-datos">
        <h2 id="que-datos">2. Qué datos recogemos</h2>

        <h3>Datos de cuenta</h3>
        <p>
          Correo electrónico y contraseña (la contraseña se guarda <strong>siempre con hash,
          nunca en claro</strong>), nombre y, de forma opcional, foto de perfil y datos
          deportivos: fecha de nacimiento, sexo, peso y altura. Los datos deportivos son
          opcionales y sirven para calcular estimaciones de tu entrenamiento.
        </p>

        <h3>Ubicación precisa (GPS)</h3>
        <p>
          CamRun recoge la <strong>ubicación precisa del dispositivo</strong>, incluida{' '}
          <strong>en segundo plano y con la pantalla apagada</strong>, únicamente mientras
          tienes una salida en grabación o participas en una carrera con seguimiento en vivo.
        </p>
        <p>
          Usamos esa ubicación para trazar la ruta, calcular distancia, ritmo y desnivel, y
          mostrar tu posición en el mapa en vivo de la maratón.
        </p>
        <p>
          La grabación <strong>se inicia siempre por una acción explícita tuya</strong> y se
          detiene cuando tú la paras. Con la aplicación abierta pero sin ninguna salida
          activa, <strong>no se recoge ninguna ubicación</strong>.
        </p>

        <h3>Actividad física</h3>
        <p>
          Distancia, ritmo y duración de tus salidas, y el sensor de reconocimiento de
          actividad del dispositivo, que usamos para ahorrar batería cuando detectamos que
          estás parado.
        </p>

        <h3>Inscripciones y pagos</h3>
        <p>
          Los datos que rellenas para inscribirte en una carrera y la imagen del comprobante
          de pago que subes.
        </p>

        <h3>Datos técnicos mínimos</h3>
        <p>
          Registros de servidor necesarios para operar el servicio y protegerlo frente a
          abusos y fallos.
        </p>
      </section>

      <section aria-labelledby="para-que">
        <h2 id="para-que">3. Para qué usamos los datos</h2>
        <p>Usamos tus datos únicamente para:</p>
        <ul>
          <li>Prestarte el servicio: tu cuenta, el historial de salidas, el plan de entrenamiento y las inscripciones a carreras.</li>
          <li>Seguridad del servicio y de tu cuenta.</li>
          <li>Atenderte cuando pides soporte.</li>
        </ul>
        <p>Nada más. No elaboramos perfiles publicitarios ni vendemos tu información.</p>
      </section>

      <section aria-labelledby="con-quien">
        <h2 id="con-quien">4. Con quién los compartimos</h2>
        <p>
          <strong>No vendemos ni compartimos datos personales con terceros con fines
          publicitarios ni de analítica.</strong> Los datos se alojan en la infraestructura
          propia de CamRun.
        </p>
        <p>Solo compartimos datos en dos casos:</p>
        <ul>
          <li>Los datos mínimos de la inscripción con el organizador de la carrera en la que te inscribes.</li>
          <li>Cuando lo exija la ley.</li>
        </ul>
      </section>

      <section aria-labelledby="seguridad">
        <h2 id="seguridad">5. Seguridad</h2>
        <p>
          Todo el tráfico entre la aplicación y el servidor viaja{' '}
          <strong>cifrado con HTTPS/TLS</strong>. Las contraseñas se almacenan con hash y las
          credenciales de sesión se guardan en el almacén seguro del dispositivo.
        </p>
      </section>

      <section aria-labelledby="conservacion">
        <h2 id="conservacion">6. Conservación y borrado</h2>
        <p>Conservamos tus datos mientras tu cuenta exista.</p>
        <p>
          Puedes <strong>eliminar tu cuenta y todos tus datos</strong> desde la aplicación, en{' '}
          <em>Perfil &gt; Ajustes &gt; Cuenta &gt; Eliminar cuenta</em>, o desde la página{' '}
          <a href="/eliminar-cuenta">Eliminar tu cuenta de CamRun</a>{' '}
          (<span className="nowrap">https://cam-run.tumype.com/eliminar-cuenta</span>).
        </p>
      </section>

      <section aria-labelledby="derechos">
        <h2 id="derechos">7. Derechos del usuario</h2>
        <p>
          Puedes ejercer tus derechos de acceso, rectificación, portabilidad y supresión
          escribiendo a <a href="mailto:alvarocallet@gmail.com">alvarocallet@gmail.com</a>.
        </p>
      </section>

      <section aria-labelledby="menores">
        <h2 id="menores">8. Menores</h2>
        <p>El servicio no está dirigido a menores de 13 años.</p>
      </section>

      <section aria-labelledby="cambios">
        <h2 id="cambios">9. Cambios en esta política</h2>
        <p>
          Si cambiamos esta política, lo avisaremos en la aplicación y publicaremos aquí la
          versión actualizada con su nueva fecha.
        </p>
      </section>
    </article>
  )
}
