/// Texto legal que la corredora acepta con el checkbox obligatorio del
/// formulario de inscripcion (RunnerDashboard). Si cambia, actualizar la fecha.
export default function Terminos() {
  return (
    <article className="legal">
      <header className="legal-head">
        <span className="eyebrow">CAM RUN</span>
        <h1>Términos, Condiciones y Deslinde de Responsabilidad — CAM RUN (Social Run)</h1>
        <p className="legal-date">
          Última actualización: <time dateTime="2026-10-18">18 de octubre de 2026</time>
        </p>
        <p className="legal-lead">
          Al inscribirme y participar en el CAM RUN, declaro haber leído y comprendido en su
          totalidad las condiciones de participación y manifiesto lo siguiente:
        </p>
      </header>

      <section aria-labelledby="caracter">
        <h2 id="caracter">1. Carácter del evento y participación voluntaria</h2>
        <p>
          Entiendo y acepto que el CAM RUN es un evento estrictamente recreativo (Social Run), no
          competitivo y sin fines de premiación por posiciones. Mi participación es libre y
          voluntaria, y declaro encontrarme en condiciones físicas y de salud adecuadas para la
          actividad. Se recomienda una evaluación médica previa ante cualquier condición o
          antecedente que pueda afectar la práctica deportiva.
        </p>
      </section>

      <section aria-labelledby="menores">
        <h2 id="menores">2. Participación de menores de edad</h2>
        <p>
          La edad mínima de participación es de 6 años. Los menores de edad deberán estar
          debidamente inscritos y acompañados en todo momento durante el recorrido por su madre,
          padre o apoderado legal, quien asume la responsabilidad total de su cuidado y
          supervisión durante el evento.
        </p>
      </section>

      <section aria-labelledby="riesgos">
        <h2 id="riesgos">3. Asunción de riesgos</h2>
        <p>
          Reconozco los riesgos inherentes a una caminata o carrera en vía pública o circuito,
          tales como caídas, golpes, lesiones, colisiones, fatiga, deshidratación, condiciones
          climáticas e irregularidades del terreno.
        </p>
      </section>

      <section aria-labelledby="normas">
        <h2 id="normas">4. Cumplimiento de normas</h2>
        <p>
          Me comprometo a respetar el recorrido, las normas de convivencia y las indicaciones de
          LA ORGANIZACIÓN, autoridades e inspectores o personal de apoyo. LA ORGANIZACIÓN se
          reserva el derecho de retirar del evento a cualquier participante que ponga en riesgo
          su seguridad o la de terceros.
        </p>
      </section>

      <section aria-labelledby="liberacion">
        <h2 id="liberacion">5. Liberación de responsabilidad</h2>
        <p>
          Asumo los riesgos derivados de mi participación y libero de toda responsabilidad a CAM
          RUN, sus organizadores, auspiciadores, aliados y proveedores por daños, pérdidas o
          perjuicios derivados de dichos riesgos o de mis propios actos, salvo en aquellos casos
          donde la ley no permita la exclusión de responsabilidad.
        </p>
      </section>

      <section aria-labelledby="dorsal">
        <h2 id="dorsal">6. Entrega y uso del dorsal</h2>
        <p>
          El evento no incluye kit de corredor; únicamente se entregará un número o dorsal de
          participante. El dorsal es personal, único e intransferible, y su portación en un
          lugar visible es obligatoria durante todo el evento para fines de identificación y
          acceso al recorrido. Las fechas y puntos de recogida de dorsales serán comunicados por
          los canales oficiales.
        </p>
      </section>

      <section aria-labelledby="reembolso">
        <h2 id="reembolso">7. Política de reembolso y modificaciones</h2>
        <p>
          El pago de la inscripción no es reembolsable ni transferible. Acepto que el evento
          podrá ser suspendido, reprogramado, modificado o cancelado por razones de fuerza mayor,
          caso fortuito, decisiones de la autoridad competente o situaciones ajenas al control de
          LA ORGANIZACIÓN.
        </p>
      </section>

      <section aria-labelledby="objetos">
        <h2 id="objetos">8. Objetos personales</h2>
        <p>
          Declaro conocer que el evento no cuenta con servicio de guardarropa. Por lo tanto, cada
          participante es responsable de la custodia de sus pertenencias. LA ORGANIZACIÓN no se
          hace responsable por la pérdida, hurto, robo o deterioro de objetos personales durante
          el desarrollo del evento.
        </p>
      </section>

      <section aria-labelledby="imagen">
        <h2 id="imagen">9. Derechos de imagen</h2>
        <p>
          Autorizo expresamente a LA ORGANIZACIÓN, auspiciadores y aliados a utilizar,
          reproducir y difundir mi imagen y la de los menores a mi cargo en fotografías o videos
          obtenidos durante la actividad. Esta autorización se otorga para fines promocionales,
          publicitarios e informativos en cualquier medio físico o digital, sin derecho a
          compensación económica.
        </p>
      </section>

      <section aria-labelledby="datos">
        <h2 id="datos">10. Protección de datos personales</h2>
        <p>
          Otorgo mi consentimiento para el tratamiento de mis datos personales en conformidad con
          la Ley N.º 29733 (Ley de Protección de Datos Personales), para fines de gestión
          logística del evento, validación de participación y envío de información sobre futuras
          actividades. Puedo ejercer mis derechos de acceso, rectificación, cancelación u
          oposición a través del correo oficial de contacto de LA ORGANIZACIÓN:{' '}
          <a href="mailto:alvarocallet@gmail.com">alvarocallet@gmail.com</a>. Más detalle en la{' '}
          <a href="/privacidad">Política de privacidad</a>.
        </p>
      </section>

      <section aria-labelledby="declaracion">
        <h2 id="declaracion">11. Declaración jurada y aceptación digital</h2>
        <p>
          Declaro que la información registrada es verdadera, completa y actual. En el caso de
          menores de edad, la inscripción y aceptación de estas condiciones la realiza su madre,
          padre o apoderado legal. La marcación de la casilla de verificación (checkbox) es
          obligatoria y constituye la firma de conformidad para completar el proceso de
          inscripción.
        </p>
      </section>
    </article>
  )
}
