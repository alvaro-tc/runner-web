# Implementación del flujo de comprobantes QR manual

Fecha: 2026-09-25
Rama: `feat/manual-payment-proof-flow`

## Resumen

Se conectó `runner-web` con el flujo existente de `runner-api` para que los pagos por QR estático puedan verificarse manualmente por un usuario con rol `admin` u `organizer`.

El sistema no se conecta a Yape, a un banco ni a una pasarela de pagos. El QR pertenece a la maratón y se muestra como imagen estática cuando está disponible. El pago queda pendiente hasta que un organizador revisa el comprobante y lo aprueba.

## Requisitos cubiertos

### Maratones en la página principal

- La portada consulta `GET /marathons`.
- Se muestran las maratones publicadas desde la base de datos.
- Se muestran nombre, ubicación, fecha, estado y acción para iniciar sesión/inscribirse.
- Se normalizó la respuesta paginada del backend (`{ items, meta }`) para que el frontend trabaje con el array de maratones.

### Subida del comprobante

- El checkout del frontend ahora usa `method: "qr_manual"`.
- Se muestra el QR configurado para la maratón.
- Se muestra la referencia o glosa de la inscripción.
- El corredor puede seleccionar una imagen y enviarla mediante `multipart/form-data`.
- Se permite enviar una referencia opcional de la transacción.
- La cabecera `Content-Type` no se fuerza cuando el cuerpo es `FormData`, permitiendo que el navegador agregue correctamente el boundary multipart.

### Estados y recibo

- `in_review`: el comprobante fue subido y espera revisión.
- `rejected`: el organizador rechazó el comprobante; se muestra el motivo y se permite subir otro.
- `approved` y pago `paid`: la inscripción se considera confirmada.
- El recibo no aparece antes de la aprobación.
- Después de la aprobación, el corredor puede solicitar el recibo mediante `GET /payments/:id/receipt`.
- El panel consulta periódicamente `GET /payments/:id` mientras el pago continúa pendiente, para detectar una aprobación posterior.
- El pago actual se guarda en `sessionStorage`, por lo que una recarga de la pestaña no elimina el estado ni el seguimiento del comprobante.
- La clave `Idempotency-Key` del checkout se guarda por inscripción y se reutiliza en reintentos, evitando abrir cobros duplicados si se pierde la respuesta de una solicitud.

### Revisión del organizador

- `admin` y `organizer` acceden al panel administrativo.
- Se agregó la pestaña `Comprobantes QR`.
- La cola consume `GET /admin/payment-proofs`.
- Cada comprobante muestra imagen, corredor, maratón, monto y referencia.
- El organizador puede aprobar o rechazar.
- El rechazo exige un motivo mediante el diálogo del navegador.
- La cola se recarga después de cada acción.

## Archivos modificados

| Archivo | Cambios |
| --- | --- |
| `src/api.js` | Checkout QR manual, soporte multipart, consulta de pago, recibo y endpoints administrativos de comprobantes. Normalización del catálogo paginado. |
| `src/RunnerDashboard.jsx` | Flujo de inscripción, QR, subida de imagen, estados de revisión/rechazo/confirmación y recibo condicionado. |
| `src/AdminDashboard.jsx` | Cola visual de comprobantes, imágenes y acciones de aprobar/rechazar. |
| `src/App.jsx` | Catálogo público de maratones desde la API y acceso de `organizer` al panel administrativo. |
| `src/Header.jsx` | Etiqueta visual específica para el rol `Organizador`. |
| `src/index.css` | Estilos responsive para maratones, QR, estados y tarjetas de comprobantes. |

## Endpoints utilizados

### Corredor

- `GET /marathons`
- `POST /registrations`
- `PATCH /registrations/:id/category-extras`
- `POST /registrations/:id/checkout`
- `GET /payments/:id`
- `POST /payments/:id/proof`
- `GET /payments/:id/receipt`

### Organizador

- `GET /admin/payment-proofs`
- `POST /admin/payment-proofs/:id/approve`
- `POST /admin/payment-proofs/:id/reject`

## Errores corregidos

1. El frontend creaba pagos como `bank_transfer`, pero el endpoint de comprobantes solo acepta pagos `qr_manual`.
2. No existía ninguna función frontend para enviar archivos como `FormData`.
3. El cliente siempre enviaba `Content-Type: application/json`, lo que impedía enviar correctamente multipart.
4. El corredor solo recibía un mensaje genérico después del checkout y no podía ver el estado real del comprobante.
5. No se conservaba el objeto de pago devuelto por el checkout.
6. No se consultaba el estado del pago después de subir el comprobante.
7. El recibo no estaba conectado ni condicionado al pago confirmado.
8. El panel React solo mostraba transferencias bancarias y no mostraba imágenes de comprobantes QR.
9. El rol `organizer` era enviado al panel de corredor porque `App.jsx` solo reconocía `admin` como rol administrativo.
10. `GET /marathons` devuelve una respuesta paginada, pero el frontend la trataba como un array directo.
11. El estado del pago se perdía al recargar la página.
12. Cada reintento del checkout generaba una clave de idempotencia nueva y podía crear un cobro adicional.

## Decisiones y límites

- No se agregó integración bancaria real.
- El QR continúa siendo estático y configurado por la organización de la maratón.
- La aprobación manual sigue siendo la fuente de verdad del pago.
- El backend ya contenía la lógica de seguridad y transición de estados, por lo que no fue necesario modificarlo funcionalmente.
- Las URLs de imágenes siguen dependiendo de la configuración existente de `StorageService`; la protección adicional de archivos privados queda como mejora independiente.
- El estado del flujo no se persiste después de cerrar completamente la sesión o recargar la página antes de finalizar. La mejora recomendada es persistir `registrationId` y `paymentId` en `sessionStorage` si se requiere recuperación automática.

## Validación realizada

- `npm run build` en `runner-web`: exitoso.
- Validación del editor en `api.js`, `RunnerDashboard.jsx`, `AdminDashboard.jsx` y `App.jsx`: sin errores.
- No se ejecutaron pruebas E2E del backend porque no hubo cambios en `runner-api` y requieren el entorno de base de datos configurado.
- Se regeneró el cliente Prisma con `npm run db:generate`; esto corrigió los errores de tipos en `src/modules/users/users.service.ts` relacionados con los campos `ci` y `mustChangePassword`, que sí existen en `schema.prisma` y en la migración correspondiente.
- El build posterior de `runner-api` avanzó más allá de esos errores, pero el entorno local no tenía instaladas `firebase-admin` ni `google-auth-library`. `npm ci`/`npm install` no pudo finalizar por un bloqueo de Windows (`EPERM`) en `node_modules/@angular-devkit/core`; no se requieren cambios en `package.json` porque ambas dependencias ya están declaradas.
- `runner-api/prisma/create-admin.ts` aparece como archivo no rastreado preexistente; no fue creado ni modificado durante este trabajo.

## Flujo esperado de punta a punta

1. El usuario abre la portada y ve las maratones cargadas desde la API.
2. Inicia sesión y crea una inscripción.
3. El frontend abre un cobro `qr_manual`.
4. El usuario paga desde su aplicación bancaria usando el QR estático.
5. Sube la imagen del comprobante.
6. La interfaz muestra `Comprobante en revisión`.
7. Un `admin` u `organizer` abre la pestaña `Comprobantes QR`.
8. Revisa la imagen, el monto y la referencia.
9. Si rechaza, el corredor ve el motivo y puede enviar otra imagen.
10. Si aprueba, el backend cambia el pago a `paid`, confirma la inscripción y asigna dorsal.
11. El corredor ve la confirmación y recién entonces puede abrir el recibo.
