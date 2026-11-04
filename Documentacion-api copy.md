# Documentación de la API de cobros QR

Cobros por QR bancario (Zas / Baneco) con **atribución automática del pago**: tu
sistema pide un cobro, recibe un QR, lo muestra a tu cliente, y la API te avisa
cuando *ese* QR se pagó. No hay que pedirle al pagador ningún comprobante ni
número de transacción.

- **Base URL**: la que te entregue el operador (en desarrollo
  `http://localhost:8080`).
- **Formato**: JSON UTF-8 en cuerpo y respuesta.
- **Moneda**: `BOB` (bolivianos), importes como **string** (`"150.00"`), nunca
  como número flotante.
- **Fechas**: RFC 3339 en UTC (`2026-10-30T17:12:43Z`).

Índice:

1. [Token: cómo te identificas](#1-token-cómo-te-identificas)
2. [Quickstart en 3 llamadas](#2-quickstart-en-3-llamadas)
3. [Referencia de endpoints](#3-referencia-de-endpoints)
4. [Cómo sabes que está pagado](#4-cómo-sabes-que-está-pagado)
5. [Estados de un cobro](#5-estados-de-un-cobro)
6. [Errores](#6-errores)
7. [Comprobante del pagador (opcional/obligatorio)](#7-comprobante-del-pagador-opcionalobligatorio)
8. [Pagos tardíos y reclamos](#8-pagos-tardíos-y-reclamos)
9. [Reglas que no puedes romper](#9-reglas-que-no-puedes-romper)
10. [Ejemplo completo](#10-ejemplo-completo)
11. [Preguntas frecuentes](#11-preguntas-frecuentes)

---

## 1. Token: cómo te identificas

Cada empresa tiene una **api key** propia. Va en **todas** las peticiones:

```
Authorization: Bearer <api_key>
```

Lo que tienes que saber:

- La api key **es la identidad de tu empresa**. Todo lo que consultes se filtra
  por ella: nunca verás un cobro de otra empresa (responde `404`, no `403`: la
  API no confirma ni que exista).
- El servidor guarda solo el **hash sha256** de la clave. Si la pierdes no se
  recupera: se rota y se te entrega una nueva.
- Si mandas `merchant_id` en el cuerpo y no coincide con tu clave → `403`.
- Sin cabecera o con clave desconocida → `401 unauthorized`.
- **Guárdala en tu servidor.** Nunca en el navegador, en una app móvil ni en un
  repositorio: con esa clave se cobra en nombre de tu empresa.

Para pruebas, el operador te da una clave de entorno de desarrollo; los cobros
que hagas con ella son **reales** (el QR es del banco), así que usa importes
pequeños.

### Alta y rotación (lo hace el operador de la pasarela, no tú)

```bash
# Alta de empresa
curl -X POST https://TU-HOST/v1/admin/companies \
  -H "Authorization: Bearer $PASARELA_ADMIN_KEY" \
  -H "X-Operator: nombre.del.operador" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tienda X","bank_account":"2101957291","currency":"BOB","device_serial":"34345fb7"}'
```

```json
{
  "id": "3f2b…",
  "api_key": "pk_…",
  "warning": "Esta clave se muestra una sola vez. Guárdala ahora: el servidor solo conserva su hash."
}
```

Rotación: `POST /v1/admin/companies/{id}/rotate-key`. La clave anterior deja de
funcionar en el acto, así que coordina el cambio antes de pedirla.

---

## 2. Quickstart en 3 llamadas

```
(1) POST /v1/pool/warm            → opcional, pero hace el cobro instantáneo
(2) POST /v1/payment-intents      → crea el cobro y devuelve el QR
(3) GET  /v1/payment-intents/{id} → ¿ya pagó?   (o WebSocket, sin sondear)
```

### (1) Precalentar el monto — recomendado

En cuanto conoces el importe (el cliente arma el carrito, antes del checkout):

```bash
curl -X POST https://TU-HOST/v1/pool/warm \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"base_amounts":["150.00","99.90"]}'
```

```json
{ "queued": 2 }
```

Responde `202`: encolar es todo lo que promete. Segundos después, el cobro de
ese monto sale **instantáneo** (`eta.source: "POOL_HIT"`). Sin precalentar, el
primer cobro de un monto nuevo tarda **~55 segundos**, porque hay que generarlo
en el teléfono.

### (2) Crear el cobro

`Idempotency-Key` es **obligatoria**. Usa tu identificador de pedido:

```bash
curl -X POST https://TU-HOST/v1/payment-intents \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: pedido-10432" \
  -d '{"base_amount":"150.00","currency":"BOB","ttl_seconds":900}'
```

```json
{
  "intent_id": "8b347f0f-5e5b-4d51-9dab-09dd1b99680d",
  "status": "AWAITING_PAYMENT",
  "qr": {
    "payload": "x6Aj+NYOfjOM…==|05cee0de1d23821443629655",
    "base_amount": "150.00",
    "final_amount": "150.01",
    "currency": "BOB",
    "reference": "PX-TPF5JYW",
    "expires_at": "2026-10-30T17:12:43Z",
    "ttl_seconds": 900,
    "bank_expires_at": "2026-10-31T03:59:59Z",
    "expiry_notice": "Este QR es válido por 15 minutos. Pasado ese tiempo no debe pagarse. Si paga más tarde, abra un reclamo con la referencia PX-TPF5JYW."
  },
  "eta": { "source": "POOL_HIT", "seconds_p50": 0, "seconds_p95": 0 },
  "ws": { "url": "/v1/ws", "ticket": "a1b2c3…" }
}
```

| Campo | Para qué sirve |
|---|---|
| `intent_id` | El id del cobro. Guárdalo contra tu pedido. |
| `qr.payload` | El string que va dentro del QR. Renderízalo tú, o pide el PNG (§3). |
| `qr.base_amount` | Lo que pediste. |
| `qr.final_amount` | **Lo que paga tu cliente.** Ver §8: los centavos son lo que permite atribuir el pago. |
| `qr.reference` | Código tipo `PX-TPF5JYW`. **Imprímelo junto al QR**: es con lo que el pagador abre un reclamo si pagó y no se le acreditó. |
| `qr.expires_at` / `ttl_seconds` | Reloj de la pasarela. Pasado eso el cobro se cierra (`EXPIRED`). |
| `qr.bank_expires_at` | Reloj del **banco**, mucho más largo: el QR sigue siendo pagable aunque la pasarela ya lo haya cerrado. |
| `qr.expiry_notice` | Texto listo para mostrar al pagador. Muéstralo: es lo que evita los pagos tardíos. |
| `eta.source` | `POOL_HIT` = instantáneo, del pool; `DEVICE` = se generó ahora en el teléfono. |
| `ws.ticket` | Ticket de un solo uso para abrir el WebSocket (§4). |

`ttl_seconds` es opcional (por defecto **900 s**) y debe caer entre
`qr.min_ttl` y `qr.max_ttl` de la configuración del servidor (hoy 120–3600 s).

### (3) Consultar

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://TU-HOST/v1/payment-intents/8b347f0f-5e5b-4d51-9dab-09dd1b99680d
```

```json
{ "intent_id": "8b347f0f-…", "status": "PAID", "settlement": { "paid": true } }
```

---

## 3. Referencia de endpoints

Todos piden `Authorization: Bearer <api_key>` salvo donde se indique.

| Método y ruta | Qué hace |
|---|---|
| `POST /v1/payment-intents` | Crea el cobro y devuelve el QR. Requiere `Idempotency-Key`. |
| `GET /v1/payment-intents/{id}` | Estado del cobro (+ el QR mientras sea entregable). |
| `POST /v1/payment-intents/{id}/cancel` | Cancela un cobro no pagado. Sobre uno pagado → `409`. |
| `GET /v1/qrs/{id}/image` | PNG del QR (360 px). `404` si el QR no tiene cobro asignado. |
| `GET /v1/qrs?state=&limit=` | Tus QR generados (panel). Los de pool salen **sin** `payload`. |
| `POST /v1/pool/warm` | Precalienta montos. `202 {"queued":N}`. |
| `GET /v1/pool/status` | Stock caliente, cola y cuántos tienes delante. |
| `GET /v1/audit/{intent_id}` | Cadena de auditoría del cobro: eventos encadenados y `tampered_at` (`-1` = íntegra). |
| `GET /v1/ws?ticket=…` | WebSocket de eventos del cobro (§4). |
| `GET /healthz`, `GET /readyz` | Salud del servicio. Sin autenticación. |
| `GET /v1/settings/receipt` | Tu configuración de comprobante (§7). |
| `PUT /v1/settings/receipt` | La cambias tú: `{"enabled":bool,"required":bool}`. `403` si el operador no te lo permitió. |
| `PUT /v1/receipts/upload/{token}` | Sube el comprobante de un cobro. **Público**, token de un solo uso. |
| `GET /v1/payment-intents/{id}/receipt` | La imagen del comprobante de tu cobro. |
| `POST /v1/tickets` | Abre un reclamo. **Público** (el pagador no tiene api key). |
| `PUT /v1/tickets/upload/{token}` | Sube el comprobante del reclamo. **Público.** |
| `GET /v1/tickets/{tracking_code}` | Estado del reclamo. **Público.** |

### Cuerpo de `POST /v1/payment-intents`

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `base_amount` | string | sí | `"150.00"`. Debe ser > 0. `"10"` y `"10.0"` son el mismo monto. |
| `currency` | string | no | `"BOB"` por defecto. |
| `ttl_seconds` | number | no | 900 por defecto; rango 120–3600. |
| `merchant_id` | string | no | Si lo mandas, debe ser el de tu api key. |

### Cabeceras

| Cabecera | Dónde | Nota |
|---|---|---|
| `Authorization: Bearer <api_key>` | todas | §1. |
| `Idempotency-Key` | `POST /v1/payment-intents` | **Obligatoria.** Tu nº de pedido. Reintentar con la misma clave devuelve el **mismo** cobro; la misma clave con otro importe → `409`. |
| `Content-Type: application/json` | peticiones con cuerpo | |

### La imagen del QR

`GET /v1/qrs/{qr_id}/image` devuelve `image/png` con `Cache-Control: no-store`.
Pide la api key **en cabecera**, así que un `<img src="…">` no sirve (no manda
cabeceras, y meter la clave en la URL la deja en los logs). Bájalo con `fetch` y
usa un `blob:`:

```js
const r = await fetch(`/v1/qrs/${qrId}/image`, { headers: { Authorization: `Bearer ${API_KEY}` } })
img.src = URL.createObjectURL(await r.blob())
```

En producción esa llamada la hace **tu servidor** (es él quien tiene la api
key), y le sirve la imagen a tu front. También puedes renderizar `qr.payload`
con cualquier librería de QR del lado del cliente y no pedir la imagen.

---

## 4. Cómo sabes que está pagado

### Opción A — sondeo (lo más simple)

`GET /v1/payment-intents/{id}` cada 2–3 segundos mientras el QR esté vivo.

**`status: "PAID"` es la verdad para tu sistema: el dinero entró.** Junto con él
llega `settlement.paid = true`. Un cobro que pasa a `PAID` no vuelve atrás.

### Opción B — WebSocket (sin sondear)

1. Toma `ws.ticket` del cuerpo del cobro.
2. Conecta a `GET /v1/ws?ticket=<ticket>`; opcional `&last_seq=<n>` para
   recuperar los eventos que te perdiste.
3. El primer mensaje es `ws.ready` y trae un **`next_ticket`**: el ticket es de
   un solo uso, guárdalo para reconectar.

```js
const ws = new WebSocket(`wss://TU-HOST/v1/ws?ticket=${ticket}`)
ws.onmessage = (e) => {
  const ev = JSON.parse(e.data)
  if (ev.type === 'ws.ready') siguienteTicket = ev.next_ticket
  if (ev.type === 'payment.detected') entregarPedido()
}
```

Todo evento llega con el mismo sobre: `seq` (correlativo por cobro, para pedir
replay con `last_seq`), `type`, `intent_id` y `ts`, más los campos propios del
evento.

| Evento (`type`) | Significa |
|---|---|
| `ws.ready` | Conectado. Trae `next_ticket`. |
| `qr.issued` | El QR del cobro ya está disponible. |
| `qr.expiring` | Está por vencer (avisa al pagador). |
| `qr.expired` | Venció o se canceló: ya no debe pagarse. |
| `payment.detected` | **Pagado.** Trae `amount` y `source`. |
| `payment.reconciled` | Pago respaldado también por el extracto del banco. |
| `payment.rejected` | Un pago no se pudo atribuir a este cobro. |
| `ticket.updated` | Cambió el estado de un reclamo asociado. |

El WebSocket es una **mejora de latencia, no la fuente de verdad**: si se cae la
conexión, confirma siempre con `GET /v1/payment-intents/{id}`.

---

## 5. Estados de un cobro

| `status` | Significa | Qué haces |
|---|---|---|
| `PENDING` | Creado, el QR todavía no se entregó. | Esperar. |
| `AWAITING_PAYMENT` | QR entregado, esperando pago. | Mostrar el QR. |
| `AWAITING_RECEIPT` | Pagado, pero falta el comprobante obligatorio (§7). | Esperar la subida o el `wait_until`. |
| `PAID` | **Pagado.** | Entregar el producto. |
| `EXPIRED` | Venció el reloj de la pasarela sin pago. | Cobro perdido; crea otro. |
| `CANCELLED` | Lo cancelaste tú. | — |
| `DISPUTED` | Entró un pago sobre un cobro ya vencido o cancelado (**pago tardío**). | **No entregues.** Lo resuelve el operador; avisa a soporte. |

---

## 6. Errores

Formato: `{"error":"<tipo>","detail":"<explicación>"}`.

| HTTP | `error` | Causa y qué hacer |
|---|---|---|
| 400 | `bad_request` | Falta `Idempotency-Key`, JSON inválido, `base_amount` ≤ 0, `ttl_seconds` fuera de rango. Arregla la petición. |
| 401 | `unauthorized` | Sin cabecera `Authorization` o api key desconocida. |
| 403 | `forbidden` | El `merchant_id` del cuerpo no es el de tu api key. |
| 404 | `not_found` | No existe ese cobro **o no es tuyo**. |
| 409 | `idempotency_conflict` | Misma `Idempotency-Key` con otro importe. Nunca te devolvemos el QR de otro monto con un `200`: cámbiala. |
| 409 | `invalid_transition` | Operación imposible (cancelar algo ya pagado). |
| 503 | `capacity_unavailable` | No hay QR en el pool y el teléfono no está disponible. |

El `503` es honesto y trae datos reales:

```json
{
  "error": "capacity_unavailable",
  "reason": "DEVICE_MAINTENANCE",
  "retry_after": 120,
  "estimated_available_at": "2026-10-30T17:20:00Z"
}
```

Respeta `Retry-After` (segundos). **No reintentes en bucle**: no hay más
capacidad por insistir, y el teléfono es un recurso único. Precalentar con
`/v1/pool/warm` es lo que evita este error.

### Los `reason` del 503

| `reason` | Qué pasa | Qué hacer |
|---|---|---|
| `NO_FREE_AMOUNT` | Los 100 centavos de ese monto base están ocupados o en cuarentena. | Reintenta pasado el `retry_after`, o cobra otro importe base. |
| `NO_NETWORK` | El teléfono no pudo generar: red caída. | Reintenta pasado el `retry_after`. |
| `DEVICE_MAINTENANCE` | Ventana de reinicio programado. `estimated_available_at` es real. | Espera a esa hora. |
| `DEVICE_SAFE_MODE` | El teléfono quedó en un estado que levanta una persona. | No hay hora prometida; reintenta con la cadencia del `retry_after` y avisa al operador. |
| `SERVICE_STOPPED` | El operador de la pasarela **detuvo el servicio** de tu empresa. Tu api key sigue siendo válida: lo que está apagado es el servicio. | **No rotes la clave**, no es un problema de credenciales. Contacta con el operador. |
| `QR_LIMIT_REACHED` | Alcanzaste tu **máximo de QR simultáneos**. | Ver abajo. |
| `API_WAIT_TIMEOUT` | La generación en el teléfono pasó del tiempo de espera que tu empresa tiene configurado. | Reintenta; o precalienta con `/v1/pool/warm` para salir por pool y no esperar nunca. |

### `QR_LIMIT_REACHED`: el máximo de QR a la vez

Tu empresa tiene un techo de **QR vivos simultáneos** (lo pone el operador de la
pasarela). Un QR cuenta como vivo desde que te lo entregamos hasta que **se paga
o se le acaba su tiempo de vida**.

Con el techo lleno, el siguiente cobro **no genera un QR más**: recibe un `503`
con el instante exacto en que se libera el primero.

```json
{
  "error": "capacity_unavailable",
  "reason": "QR_LIMIT_REACHED",
  "retry_after": 412,
  "estimated_available_at": "2026-10-30T17:26:52Z"
}
```

Es un límite **estricto** y existe por ti: con mucha afluencia, un teléfono
generando QR sin freno produce QR que vencen sin pagarse y pagos tardíos que se
atribuyen al cobro equivocado. Si el techo te queda corto para tu volumen real,
pídele al operador que lo suba — no lo resuelvas reintentando.

`retry_after` es el tiempo que falta para que venza el QR más antiguo, así que
**un solo reintento pasado ese plazo** basta. Si un cliente paga antes, el hueco
se libera incluso antes.

---

## 7. Comprobante del pagador (opcional/obligatorio)

Además del aviso del banco, puedes exigir que **el pagador suba el comprobante**
(captura o PDF) antes de que la API te confirme el cobro. Sirve para tener
expediente propio en caso de reclamo.

### Los tres interruptores

| Interruptor | Quién lo pone | Qué hace |
|---|---|---|
| `allowed` | **El operador de la pasarela** (clave de admin) | Permite que tu empresa use la función. Por defecto `false`. |
| `enabled` | **Tú** (`PUT /v1/settings/receipt`) | Enciende la subida en tus cobros. Solo surte efecto si `allowed`. |
| `required` | **Tú** | `false` = subida **opcional**: la confirmación es instantánea. `true` = **obligatoria**: la API espera el comprobante antes de confirmar. |

```bash
# Consultar
curl -H "Authorization: Bearer $API_KEY" https://TU-HOST/v1/settings/receipt
# { "allowed": true, "enabled": true, "required": true, "effective": true }

# Cambiar (si el operador te lo permitió; si no, 403 forbidden)
curl -X PUT https://TU-HOST/v1/settings/receipt   -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json"   -d '{"enabled":true,"required":true}'
```

`effective = allowed && enabled`. Si el operador te retira el permiso, tu
configuración se apaga sola (no vuelve a encenderse si te lo devuelven).

### Qué cambia en el cobro

Con la función activa, `POST /v1/payment-intents` añade un bloque `receipt`:

```json
"receipt": {
  "required": true,
  "received": false,
  "upload_url": "/v1/receipts/upload/rc_v7wkbbr2…",
  "upload_expires_at": "2026-10-30T22:33:37Z",
  "wait_until": "2026-10-30T22:03:37Z",
  "max_bytes": 10485760,
  "accepted_types": ["image/png", "image/jpeg", "image/webp", "application/pdf"]
}
```

**`upload_url` se entrega una sola vez, aquí.** El servidor solo guarda el hash
del token: si lo pierdes no se recupera. Pásalo a tu página de pago (QR o
enlace) para que el pagador suba la imagen desde su móvil.

La subida es la misma mecánica que la de los reclamos: `PUT` con el fichero
crudo en el cuerpo, token de un solo uso, tipo por magic bytes.

```bash
curl -X PUT "https://TU-HOST/v1/receipts/upload/rc_v7wkbbr2…"   --data-binary @comprobante.jpg
```

| Código | Significa |
|---|---|
| `201` | Subido. Devuelve `intent_id`, `content_type` y `sha256`. |
| `410 upload_url_invalid` | El enlace ya se usó o caducó. |
| `413 too_large` | Supera `max_bytes`. |
| `415 unsupported_type` | El contenido no es de los `accepted_types`. |

### Si es obligatorio: el estado `AWAITING_RECEIPT`

Con `required: true`, cuando entra el pago **la API no te dice `PAID` todavía**:

```json
{ "intent_id": "…", "status": "AWAITING_RECEIPT",
  "settlement": { "paid": false, "waiting_for": "RECEIPT" },
  "receipt": { "required": true, "received": false, "wait_until": "…" } }
```

En cuanto el comprobante se sube, el mismo `GET` pasa a `status: "PAID"` y
`receipt.received: true`, con `receipt.url` para descargar la imagen.

Por WebSocket el orden es el mismo: primero `payment.pending_receipt` (trae
`amount` y `wait_until`), luego `receipt.received` y `payment.detected`.

**La espera tiene tope: `wait_until`, que es el vencimiento del QR.** Si el
pagador se marcha sin subir nada, al llegar esa hora el cobro se responde
`PAID` igualmente y queda `RECEIPT_MISSING` en la auditoría. Es deliberado: el
dinero entró de verdad, y un pedido pagado que la empresa nunca llega a ver
acaba siendo un problema peor que la falta de la imagen.

Con `required: false` la confirmación es instantánea (`PAID` en cuanto entra el
pago) y el `upload_url` sigue disponible: si el pagador sube la imagen, se
guarda en el expediente igual.

### Dónde queda la imagen

- `GET /v1/payment-intents/{id}/receipt` con tu api key: la imagen de tu cobro.
- Guardada direccionada por su `sha256` (el mismo que te devuelve la subida):
  si alguien la cambiara, el hash dejaría de cuadrar. Retención 5 años.
- La auditoría registra `RECEIPT_REQUESTED`, `RECEIPT_UPLOADED` (con el hash) y
  `RECEIPT_MISSING` cuando se confirmó sin evidencia.

## 8. Pagos tardíos y reclamos

El QR sigue siendo pagable para el banco bastante después de que la pasarela
cierre el cobro: compara `expires_at` con `bank_expires_at`. Es la causa número
uno de incidencias, y por eso cada QR lleva `reference` y `expiry_notice`.

Si tu cliente pagó tarde o dice que pagó y no se le acreditó:

| Paso | Llamada | Quién |
|---|---|---|
| 1. Abrir el reclamo | `POST /v1/tickets` con `reference` (o `intent_id`), `type`, `transaction_number`, `paid_amount`, `paid_at`, `contact`, `notes` | El pagador (**público**, sin api key). Devuelve `tracking_code`. |
| 2. Subir comprobante | `PUT /v1/tickets/upload/{token}` | El pagador. |
| 3. Seguimiento | `GET /v1/tickets/{tracking_code}` | El pagador. |
| 4. Resolución | `POST /v1/tickets/{id}/resolve` con `CREDIT`, `REJECT`, `REQUEST_INFO`, `REFUND` o `ESCALATE` | **El operador** de la pasarela: exige `X-Operator` y un `reason`, y queda firmado en la auditoría. |

### Imágenes de comprobante (evidencia del reclamo)

`POST /v1/tickets` responde con todo lo necesario para la subida:

```json
{
  "ticket_id": "…",
  "tracking_code": "tk_…",
  "status_url": "/v1/tickets/tk_…",
  "upload_url": "/v1/tickets/upload/up_…",
  "upload_expires_at": "2026-10-30T18:00:00Z",
  "max_receipt_bytes": 10485760,
  "accepted_types": ["image/png", "image/jpeg", "image/webp", "application/pdf"]
}
```

La subida es un `PUT` con **el fichero tal cual en el cuerpo** (no
`multipart/form-data`):

```bash
curl -X PUT "https://TU-HOST/v1/tickets/upload/up_…" \
  --data-binary @comprobante.jpg
```

Reglas de la subida:

- El token es **de un solo uso** y caduca (`upload_expires_at`, hoy 30 min).
  Vencido o ya usado → la subida se rechaza; hay que pedir uno nuevo.
- El tipo se decide por los **magic bytes** del contenido, no por la extensión
  ni por el `Content-Type` que mandes: un `.exe` renombrado a `.png` no entra.
  Solo se aceptan los `accepted_types`.
- Códigos: `201` subido, `413 too_large` si supera `max_receipt_bytes`
  (10 MiB), `415 unsupported_type` si el contenido no es de los aceptados,
  `410 upload_url_invalid` si el enlace ya se usó o caducó.
- Cada comprobante se guarda direccionado por su `sha256`, y ese hash es lo que
  se enlaza en la resolución del reclamo: la evidencia no se puede cambiar sin
  que la auditoría lo note. Retención 5 años (evidencia legal).
- Las imágenes **solo las ve el operador**
  (`GET /v1/tickets/{id}/evidence/{eid}`, con `X-Operator`), nunca se sirven
  públicamente.

Hoy el comprobante vive **solo en el reclamo**: es evidencia para resolver una
disputa, no un paso del cobro normal. El cobro se acredita con el aviso del
banco, sin pedirle nada al pagador.

### Pago sobre un QR sin cobro (`ORPHAN_PAYMENT`)

Los QR del pool se generan **antes** de que exista un cobro. Si alguien paga uno
de esos, el dinero se registra pero no hay cobro al que atribuirlo: se abre un
ticket `ORPHAN_PAYMENT` y se resuelve a mano.

La API no te entrega QR de pool: en `GET /v1/qrs` salen con `payload: ""` y su
imagen responde `404`. **El único sitio del que sale un QR pagable es la
respuesta de `POST /v1/payment-intents`.** Muestra ese y solo ese.

---

## 9. Reglas que no puedes romper

1. **Cobra `final_amount`, no `base_amount`.** Si pides `"150.00"` puedes recibir
   `"150.01"`: ese centavo es lo que distingue dos cobros simultáneos del mismo
   importe y lo que permite atribuir el pago automáticamente. Si cobras el monto
   base, el pago no se detecta.
2. **Una `Idempotency-Key` por pedido.** Reintentar con la misma es seguro;
   reutilizarla para otro importe es un `409`.
3. **La api key vive en tu servidor.** Jamás en el front ni en la app.
4. **Muestra `reference` y `expiry_notice` junto al QR.** Sin la referencia, un
   pago tardío solo se puede cotejar por monto, que es justo lo ambiguo.
5. **Entrega con `PAID`.** Con `DISPUTED`, no: escala.
6. **Respeta `Retry-After` en el `503`.**
7. **No muestres QR que no vengan de tu cobro** (§7).

---

## 10. Ejemplo completo

Servidor Node (sin dependencias) que cobra y espera el pago:

```js
const API = 'https://TU-HOST'
const KEY = process.env.PASARELA_API_KEY          // nunca en el cliente

const call = async (method, path, body, extra = {}) => {
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...extra },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(j.error || r.status), { status: r.status, body: j })
  return j
}

async function cobrar(pedidoID, monto) {
  // 1) Precalentar en cuanto se conoce el monto (opcional, hace el cobro instantáneo)
  await call('POST', '/v1/pool/warm', { base_amounts: [monto] }).catch(() => {})

  // 2) El cobro
  let cobro
  try {
    cobro = await call('POST', '/v1/payment-intents',
      { base_amount: monto, currency: 'BOB', ttl_seconds: 900 },
      { 'Idempotency-Key': `pedido-${pedidoID}` })
  } catch (e) {
    if (e.status === 503) {
      // Sin capacidad: reintenta cuando dice, no en bucle.
      return { reintentar_en: e.body.retry_after }
    }
    throw e
  }

  // 3) Esto es lo que se muestra al cliente
  return {
    intent_id: cobro.intent_id,
    payload: cobro.qr.payload,              // renderizar como QR
    cobrar: cobro.qr.final_amount,          // <- lo que paga el cliente
    referencia: cobro.qr.reference,         // imprimir junto al QR
    aviso: cobro.qr.expiry_notice,          // mostrar junto al QR
    vence: cobro.qr.expires_at,
  }
}

// Sondeo hasta que pague o venza el QR
async function esperarPago(intentID, hasta) {
  while (Date.now() < hasta) {
    const v = await call('GET', `/v1/payment-intents/${intentID}`)
    if (v.status === 'PAID') return 'PAGADO'          // entrega el pedido
    if (v.status === 'DISPUTED') return 'REVISAR'     // NO entregues: escala
    if (v.status === 'EXPIRED' || v.status === 'CANCELLED') return 'SIN_PAGO'
    await new Promise(r => setTimeout(r, 2500))
  }
  return 'SIN_PAGO'
}
```

---

## 11. Preguntas frecuentes

**¿Por qué el monto no es el que pedí?**
Porque dos cobros del mismo importe serían indistinguibles cuando llega el aviso
del banco. La pasarela añade centavos (`150.00` → `150.01`) y esos centavos son
la atribución. Cobra siempre `final_amount`.

**¿Cuánto tarda en salir un QR?**
Instantáneo si el monto estaba precalentado (`eta.source: POOL_HIT`). Si no,
~55 segundos: los QR se generan conduciendo la app del banco en un teléfono
real. Usa `/v1/pool/warm`.

**¿Cuánto tarda en detectarse el pago?**
Segundos: la pasarela lee el aviso de pago del banco en el teléfono. No depende
de que tu cliente te mande nada.

**¿Puede un QR pagarse dos veces?**
No: es de un solo uso. Al pagarse queda `CONSUMED` y el banco lo rechaza.

**¿Y si mi cliente paga después de que venza?**
El cobro queda `EXPIRED` y el pago entra como tardío: el cobro pasa a
`DISPUTED` o se abre un reclamo con la `reference`. No entregues por tu cuenta.

**¿Puedo tener varios cobros abiertos a la vez?**
Sí. El límite práctico es el stock de centavos por monto base y la capacidad del
teléfono; cuando se agota recibes `503` con `Retry-After` real.

**¿Qué pasa si se cae mi servidor en medio?**
Nada se pierde: reintenta `POST /v1/payment-intents` con la **misma**
`Idempotency-Key` y recuperas el mismo cobro con su QR; o consulta por
`intent_id`.

**¿La API me dice si el pago está "validado" contra el extracto?**
No. Internamente cada pago lleva una confianza (`PROVISIONAL` por el aviso del
banco, `CONFIRMED` tras conciliar el extracto), pero eso es auditoría interna de
la pasarela. Para ti el pago está **pagado** (`status: PAID`,
`settlement.paid: true`) y es la única señal que necesitas para entregar.

**¿Puedo exigir el comprobante al pagador?**
Sí, si el operador te lo permite: §7. Opcional (confirmación instantánea) u
obligatorio (la API espera la imagen antes de decir `PAID`, con tope en el
vencimiento del QR).

**¿Puedo ver la traza de un cobro?**
`GET /v1/audit/{intent_id}` devuelve la cadena de eventos encadenada por hash
(`INTENT_CREATED`, `QR_ISSUED`, `PAYMENT_SETTLED`, …) y `tampered_at` (`-1` si
la cadena está íntegra).

---

## 12. Consola (Kipu): usuarios, roles y servicio

La consola web no usa api key: cada persona entra con correo y contraseña y el
servidor le da una cookie de sesión. Hay dos roles:

| Rol | Ve | Puede |
|---|---|---|
| `platform_admin` | todas las empresas | todo `/v1/admin/*` y `/v1/me/*` de cualquier empresa con `?merchant=<id>` |
| `company_admin` | **solo su empresa** | `/v1/me/*`; otra empresa en `?merchant=` o cualquier `/v1/admin/*` → `403` |

`ADMIN_KEY` + `X-Operator` siguen funcionando para scripts. Con sesión, el
`X-Operator` lo pone el servidor con el email del usuario: la bitácora firma con
quien de verdad hizo el cambio.

### Primer usuario

```bash
echo 'una-clave-de-10+' | pasarela -create-user root@kipu.bo platform_admin
echo 'otra-clave-10+'   | pasarela -create-user caja@acme.bo company_admin <merchant_id>
```

La contraseña se lee de stdin (mínimo 10 caracteres). Requiere la migración
`0014_users.sql`.

### Sesión

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/v1/auth/login` | `{email, password}` → cookie `kipu_session` (HttpOnly, SameSite=Strict, Secure fuera de localhost, 12 h) + `{user:{email, role, merchant_id, merchant_name}}` |
| POST | `/v1/auth/logout` | borra la sesión (`204`) |
| GET | `/v1/auth/me` | el usuario de la cookie, o `401` |
| POST | `/v1/auth/password` | `{current_password, new_password}` (≥10 caracteres, distinta de la actual) → `{user}`. Esta sesión sigue; las demás del usuario se cortan. Actual mala → `403 wrong_password`; débil → `400 weak_password` |
| POST | `/v1/auth/email` | `{email, password}` → `{user}` con el correo nuevo. Contraseña mala → `403 wrong_password`; correo de otra cuenta → `409` |

Ambas cuentan contra el mismo límite de 5 intentos por minuto (`429`).

**Contraseña temporal.** La que genera la plataforma (alta o reseteo) llega con
`must_change_password: true` en `user`. Mientras lo esté, la sesión solo abre
`/v1/auth/me`, `/v1/auth/password` y `/v1/auth/logout`; todo lo demás responde
`401`. La consola muestra la pantalla "Elige tu contraseña".

Errores del login: `401 invalid_credentials` ("Correo o contraseña incorrectos",
sin decir cuál falló) y `429 too_many_attempts` con `retry_after` (segundos) y
cabecera `Retry-After`: más de 5 intentos por minuto por IP + correo.

### Vista de empresa — `/v1/me/*`

Todas con la cookie. `platform_admin` añade `?merchant=<id>`.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/v1/me/overview?range=today\|7d\|30d` | `kpis` (`collected`, `collected_prev` = mismo largo antes, `by_state`, `tickets_open`), `qr` (`alive`, `limit`, `next_free_at`), `service` (`state`: `live` \| `stopped` \| `busy` = el teléfono atiende a otra empresa; `since`) |
| GET | `/v1/me/settings` | `settings` (`max_concurrent_qr`, `receipt`: `none\|optional\|required`, `tickets_enabled`, `audit_daily_at`), `receipt_allowed`, `defaults` |
| PUT | `/v1/me/settings` | **solo** esos cuatro campos; cualquier otro del cuerpo se ignora. `receipt` ≠ `none` sin permiso de la plataforma → `403` |
| POST | `/v1/me/service/start` | inicia el servicio de la empresa (ver abajo) |
| POST | `/v1/me/service/stop` | lo detiene; si el teléfono atiende a otra empresa → `409 busy` |
| POST | `/v1/me/rotate-key` | nueva api key, se muestra una sola vez |
| GET | `/v1/me/intents?state=&q=&limit=&offset=` | cobros (`q` busca por id, referencia o monto) + `has_more` |
| GET | `/v1/me/qrs?state=&limit=` · `/v1/me/qrs/{id}/image` | QR generados (sin payload si no tienen cobro) |
| GET | `/v1/me/tickets?state=` | reclamos de la empresa |
| GET | `/v1/me/logs?kind=&since=&until=&cursor=&limit=` | historial con `tampered_at` (`-1` = íntegro) |
| GET | `/v1/me/intents/{id}/audit` | línea de tiempo de un cobro (`events`, `tampered_at`); cobro de otra empresa → `404` |
| GET | `/v1/me/intents/{id}/receipt` | comprobante del pagador (imagen/PDF) o `404` si no hay |

### Usuarios de una empresa — solo `platform_admin`

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/v1/admin/companies/{id}/users` | `users[]` (`id`, `email`, `active`, `created_at`, `last_login_at`) |
| POST | `/v1/admin/companies/{id}/users` | `{email}` → crea un `company_admin`; `201 {email, password}` con la contraseña inicial generada, **se muestra una sola vez**. Correo repetido → `409` |
| DELETE | `/v1/admin/companies/{id}/users/{uid}` | desactiva y corta sus sesiones al instante (`204`); usuario de otra empresa → `404` |
| POST | `/v1/admin/companies/{id}/users/{uid}/reset-password` | contraseña olvidada: `200 {email, password}` con una **temporal**, se muestra una sola vez; corta sus sesiones y le obliga a cambiarla al entrar |
| PATCH | `/v1/admin/companies/{id}/users/{uid}` | `{email}` → cambia su correo de acceso (la contraseña no cambia). Correo repetido → `409` |

Todo queda en la bitácora de la empresa (`USER_CREATED`, `USER_DEACTIVATED`,
`USER_PASSWORD_RESET`, `USER_EMAIL_CHANGED`, `USER_PASSWORD_CHANGED`) con el actor.

### Un solo "En vivo"

- **Iniciar** (`/v1/me/service/start` o `/v1/admin/service/start {merchant_id}`):
  la validación previa corre **siempre** (`422` con `checks` si falla); el pool
  sale de los ajustes de la empresa (fallback al YAML); el teléfono es el **asignado a la empresa** (`device.merchant_id`). Sin
  teléfono asignado, el check `dispositivo` falla. Deja `api_enabled=true` y
  responde `200 {running: true, checks}`.
- **Detener** deja `api_enabled=false`: la API de esa empresa responde `503`.
- Un solo servicio a la vez: iniciar con otro vivo → `409 busy`.
- Ambos quedan en la bitácora (`SERVICE_STARTED` / `SERVICE_STOPPED`) con el actor.
