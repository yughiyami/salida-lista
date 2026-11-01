# Salida Lista — Documento funcional y técnico del MVP

**Versión:** 0.1 · **Fecha:** 16 de octubre de 2026 · **Estado:** propuesta implementable, todavía no desarrollada ni validada en campo.

## 1. Decisión de producto

**Una aplicación móvil para que guía y operaciones mantengan la responsabilidad sobre una salida turística, incluso durante periodos sin internet.** Importa reservas, prepara información offline, registra cambios en campo y distingue entre guardar un hecho, comunicarlo y obtener atención humana.

No es un motor de reservas, un servicio de rescate ni un localizador permanente de cada turista. La ubicación del teléfono del guía no representa la ubicación de todos sus participantes.

### Camino rápido de lectura

1. Producto y límites: secciones 1–3.
2. Uso y pantallas: secciones 4–6.
3. Implementación: secciones 7–11.
4. Pruebas y decisión de lanzamiento: secciones 12–15.

### Comprador, usuarios y valor

| Elemento | Definición |
|---|---|
| Comprador inicial | Operador peruano con excursiones de campo, guías y una persona real de guardia. |
| Usuario de campo | Guía responsable de un grupo o subgrupo. |
| Usuario de operaciones | Persona que recibe partes, acepta seguimiento y ejecuta el protocolo de la agencia. |
| Administrador | Autoriza Bókun, usuarios y número empresarial, desde el móvil; la autorización externa puede abrir un navegador. |
| Motivo para pagar | Menos reconstrucción de mensajes, cambios sin dueño y contactos pendientes olvidados; historial operativo verificable. |
| Hipótesis comercial | La agencia pagará por esa mejora; todavía requiere piloto pagado, no se considera demostrada. |

**Mobile-only** significa que todos los flujos operativos están en Android/iOS. Sí existe un backend y se utilizan servicios externos; no habrá un panel web propio en el MVP.

## 2. Caso de referencia y supuestos

El caso se basa en la ruta real Salkantay de cinco días/cuatro noches publicada por Apus Perú, agencia que también describe medidas de seguridad y comunicaciones satelitales. **No existe una relación comercial declarada con esa agencia ni evidencia aquí de que use Bókun.** [Ruta real](https://www.apus-peru.com/tour/salkantay-trek-5d/), [medidas publicadas](https://www.apus-peru.com/trekking-safety-measures/).

Simulación para diseño: ocho participantes, dos guías —Luis y Ana— y una responsable —Carla— en Cusco. Bókun como sistema comercial es un supuesto a verificar con el operador piloto. Horas, personas y cambios son ficticios; no se presentan como procedimiento certificado de esa agencia.

### Alcance cerrado

- Importación Bókun de solo lectura.
- Preparación y descarga verificable de una salida.
- Asignación de participantes y responsables.
- Plan de comunicaciones aceptado por operaciones.
- Mapa offline y posición del dispositivo.
- Registro offline de hitos, cambios, demoras, incidencias y retorno.
- Partes compactos por API o WhatsApp, con recepción y aceptación separadas.
- Guardia móvil, seguimiento de contactos pendientes y cierre.

### No incluido

- App obligatoria para turistas, reservas, pagos, reembolsos o marketplace de guías.
- Promesas de cobertura, rescate automático, diagnóstico o rutas de evacuación generadas por IA.
- Rastreo individual de personas sin dispositivo/canal autorizado.
- Malla automática, retransmisión pasiva permanente o integración satelital universal.
- Lectura de chats personales y automatización de WhatsApp Web.
- Sincronización colaborativa sin conexión con múltiples escritores de un mismo grupo.

Nearby será un experimento técnico aislado; solo pasa al producto si supera sus pruebas. D2C es un transporte externo condicionado, no una capacidad que podamos fabricar desde Expo.

## 3. Reglas que el producto nunca debe romper

1. **Guardado local ≠ recibido por la oficina ≠ aceptado por una persona.**
2. Abrir el selector para compartir no marca un mensaje como enviado.
3. Un contacto vencido significa «pendiente de verificar», no «persona desaparecida».
4. Una ubicación tiene hora, precisión y procedencia; no se representa como actual si es antigua.
5. El servidor solo conoce el plan de comunicaciones que recibió y aceptó. Un cambio offline no aplaza silenciosamente su plazo.
6. Cada subgrupo tiene un responsable. Los cambios contradictorios quedan pendientes de resolución, no se resuelven por la hora del teléfono.
7. Un evento confirmado localmente no desaparece por cerrar o reiniciar la app.
8. Un registro atrasado no borra ni reemplaza un estado posterior confirmado.
9. Ninguna pantalla utiliza «seguro» como deducción de que no llegaron incidencias.
10. Siempre se informa qué no está disponible: red, posición, descarga, permisos o aceptación remota.

## 4. Flujo del guía

### 4.1 Preparar, con conexión

1. Iniciar sesión y abrir la salida asignada.
2. Revisar origen Bókun, versión y última actualización.
3. Completar campos faltantes; no volver a crear las reservas.
4. Descargar participantes, ruta, mapa, contactos, protocolo y plan.
5. Comprobar integridad de la descarga; abrir el mapa con la red desactivada.
6. Confirmar presencia y asignación inicial de los ocho participantes.
7. Registrar el checklist de equipo definido por la agencia, batería y prueba de canal.
8. Enviar preparación; esperar aceptación de Carla.

Si falta la aceptación, puede consultar y registrar datos locales, pero verá «guardia no activada». La política de salida y excepciones pertenece al operador; el software no certifica seguridad.

### 4.2 En ruta, con o sin conexión

1. Abrir mapa y registrar hitos; el seguimiento de ubicación se inicia y detiene explícitamente.
2. Crear un evento con pocos toques: tipo, descripción y, si procede, foto/voz.
3. Añadir posición cuando esté disponible; aceptar también un evento sin posición.
4. Guardar en una transacción local y mostrar comprobante.
5. Intentar sincronizar si nuestra API responde; en otro caso mantenerlo pendiente.

### 4.3 División de grupo de ejemplo

Dos participantes regresan con Ana y seis continúan con Luis. El cambio registra los IDs de los participantes, responsable nuevo, motivo y momento efectivo.

Antes de dividirse, ambos guías revisan y confirman presencialmente el cambio. El MVP puede exportar/importar un paquete compacto mediante QR entre ambos teléfonos, sin internet; incluye solo referencias y datos mínimos y debe validar firma del dispositivo autorizado, integridad y versión. Si el paquete no cabe o no se valida, no se simula una transferencia digital: se mantiene el procedimiento de respaldo de la agencia y se registra la excepción. Cada teléfono ya debe tener descargada la salida.

Este QR transfiere un cambio puntual, no seguimiento en vivo. La confirmación local no implica recepción central. Para el primer piloto también se puede restringir la operación a grupos preasignados para reducir complejidad, pero esa restricción debe aparecer en el alcance contratado.

### 4.4 Comunicar y cerrar

1. Ver resumen del parte y sus datos faltantes.
2. Enviar por API o abrir WhatsApp con el texto; el guía realiza el envío.
3. Consultar recepción y aceptación cuando exista un canal de retorno.
4. Al finalizar, confirmar estado de participantes y pendientes.
5. Solicitar cierre; operaciones confirma cierre central. Si falta conexión, queda «cierre local pendiente de recepción».

## 5. Flujo de operaciones

1. **Antes:** autorizar integración, revisar importación y completar responsables/ruta/protocolo.
2. **Activar guardia:** aceptar una versión del plan; servidor registra responsable y plazos.
3. **Durante:** consultar último parte recibido, su antigüedad, grupos y próxima comunicación esperada.
4. **Parte nuevo:** revisar remitente y datos; aceptar seguimiento o asignarlo mediante transferencia explícita a otro responsable.
5. **Contacto pendiente:** verificar canales y aplicar el protocolo de la agencia. Registrar cada intento y resultado.
6. **Cambio de plan:** aceptar la nueva versión; conservar la anterior en auditoría.
7. **Retorno:** resolver participantes no conciliados, revisar incidencias y cerrar.

Si el celular de operaciones está offline, su pantalla también puede estar desactualizada. El servidor mantiene los plazos y encola notificaciones, pero no puede garantizar que una persona las vea. La guardia necesita respaldo humano y un canal acordado; una push no sustituye esa organización.

## 6. Pantallas y estados

| ID / pantalla | Guía | Operaciones | Estados y errores indispensables |
|---|---|---|---|
| P01 Acceso y configuración | Iniciar sesión, permisos graduales. | Conectar Bókun, WhatsApp y equipo. | Sin autorización, credencial vencida, conexión pendiente; secretos nunca visibles. |
| P02 Mis salidas | Ver asignadas, abrir, descargar. | Revisar importadas y pendientes. | Sin descargar, descargando, lista offline, desactualizada, error recuperable. |
| P03 Preparar salida | Presencia, checklist, canal, descarga. | Completar responsables y aceptar plan. | Faltantes concretos; excepción con autor y motivo; no «certificación segura». |
| P04 En ruta | Mapa, ubicación propia, hitos. | Última posición recibida, no posición imaginada. | Precisión, hora, sin GNSS, mapa fuera del área, cola pendiente, batería. |
| P05 Participantes | Grupo, responsable, transferencia. | Conciliar cambios y conflictos. | No presente, asignado, transferencia pendiente/confirmada; conflicto visible. |
| P06 Registrar evento | Tipo, texto/voz/foto, ubicación. | Registrar intentos de contacto y seguimiento. | Archivo no guardado, espacio insuficiente, sin coordenadas, guardado local. |
| P07 Comunicar | Previsualizar texto, API, WhatsApp. | Ver fuente y detalle recibido. | Pendiente local, recibido central, aceptado; sin inferir envío por compartir. |
| P08 Guardia | Ver responsable asignado. | Plazos, aceptar, reasignar, seguimiento. | Contacto esperado, pendiente de verificar, incidencia en seguimiento; datos antiguos. |
| P09 Cierre | Conciliar y solicitar cierre. | Confirmar cierre o mantener pendientes. | Cierre local, central, medios pendientes y elementos sin resolver. |

### P04 — En ruta: esquema funcional

```text
SALKANTAY · DÍA 2                 [Sin conexión API]
Mi grupo: 6 personas · Luis

[ Mapa descargado + posición propia ]
Posición: hace 12 s · precisión estimada 18 m

Oficina: última aceptación 08:10
Pendientes: 2 eventos · 1 fotografía

[Registrar hito]       [Cambio de grupo]
[Registrar incidencia]
[Preparar parte]
```

### P08 — Guardia: esquema funcional

```text
SALKANTAY · Guardia: Carla
Datos actualizados en este teléfono: 11:03

Último parte recibido: 10:58
Hecho registrado en campo: 10:42
Grupo A: 6 con Luis / Grupo B: 2 con Ana

Cambio de grupo · PENDIENTE DE ACEPTAR
[Ver detalle] [Aceptar seguimiento]

Próximo contacto: según plan aceptado v3
[Registrar intento de contacto]
```

Cifras y horarios del esquema son ejemplos, no telemetría real. Interfaz en español; fechas visibles en hora de Perú, transporte en UTC con desfase registrado. Controles grandes, legibles al sol y accionables con una mano. No depender solo del color para indicar estados.

## 7. Arquitectura propuesta

```text
                 BÓKUN
            API + webhooks
                    │
                    ▼
 ┌────────────────────────────────────────────┐
 │ Backend modular TypeScript                 │
 │ Identidad y roles · Salidas · Eventos       │
 │ Conector Bókun · Recepción WhatsApp         │
 │ Planes de contacto · Auditoría             │
 └───────┬─────────────────────┬───────────────┘
         │                     │
 PostgreSQL + archivos    Worker durable
 transacciones/outbox     reintentos/plazos/notificaciones
         │                     │
         └─────────┬───────────┘
                   │ API HTTPS y recepción de webhooks
       ┌───────────┴────────────┐
       ▼                        ▼
 App Expo / guía        App Expo / operaciones
 SQLite + archivos      SQLite + vistas locales
 mapa + GNSS            guardia y aceptación
       │
       ├─ compartir texto → WhatsApp → número empresarial
       ├─ QR de transferencia puntual → otro guía
       └─ Nearby experimental ↔ teléfono próximo
```

### Decisiones y límites

| Decisión | Motivo / coste |
|---|---|
| React Native + TypeScript + Expo Router | Código compartido y acceso nativo; no elimina trabajo específico Android/iOS. |
| Development builds desde el inicio | Ubicación y mapas requieren configuración nativa; Expo Go no es el entorno de aceptación. |
| Backend modular, no microservicios | Menor complejidad inicial; separar conectores y worker sin desplegar múltiples servicios innecesarios. |
| PostgreSQL y archivos separados | Integridad relacional y auditoría; medios con permisos y retención propios. Proveedor aún no contratado. |
| Eventos inmutables y vistas derivadas | Facilita auditoría/deduplicación; exige proyecciones y manejo explícito de conflictos. No requiere event sourcing de toda la aplicación. |
| Un dispositivo escritor por subgrupo | Evita coordinación multimaestro offline en el MVP; traspaso requiere confirmación y límites visibles. |
| Nearby bajo bandera experimental | Probar interoperabilidad y batería antes de convertirlo en requisito comercial. |

### Módulos móviles

```text
app/                    rutas Expo Router por rol
src/features/departures/ preparación y descarga
src/features/field/      mapa, grupos y registro
src/features/guard/      recepción, plazos y aceptación
src/features/reports/    parte compacto y compartir
src/domain/              tipos, validadores y reglas puras
src/data/local/          SQLite, migraciones y repositorios
src/sync/                outbox, cursor, reconciliación
src/native/              ubicación y transporte local
src/security/            sesión, llaves y permisos
```

Son rutas propuestas para una implementación futura, no archivos existentes.

### Componentes Expo y mapas

- `expo-sqlite`: paquetes, eventos y outbox. SQLCipher habilitado en compilación para la base sensible; claves pequeñas en `expo-secure-store`. Archivos requieren protección adicional: cifrar la BD no cifra las fotos.
- `expo-file-system`: archivos persistentes. Un adjunto no se considera guardado si permanece solo en caché temporal.
- `expo-location` y `expo-task-manager`: tareas definidas a nivel de módulo, permisos y modos nativos. Seguimiento solo durante la salida y con consentimiento apropiado.
- `expo-camera` y `expo-audio`: QR y captura explícita; no grabación continua.
- `expo-notifications`: recordatorios locales y notificaciones remotas; recepción no garantizada.
- MapLibre React Native: región offline, ruta y recursos de estilo necesarios. Cartografía con licencia de descarga; no descarga masiva indiscriminada de tiles públicos.
- Nearby: SDK nativo Android/iOS y puente propio o wrapper auditado. No se ha elegido ni verificado un wrapper concreto.

Expo documenta límites por terminación de la app y diferencias entre sistemas. Una tarea de fondo no constituye un servicio inmortal. SQLCipher y otros cambios nativos exigen recompilar. [Ubicación Expo](https://docs.expo.dev/versions/latest/sdk/location/), [SQLite Expo](https://docs.expo.dev/versions/latest/sdk/sqlite/), [MapLibre con Expo](https://maplibre.org/maplibre-react-native/docs/setup/expo/), [mapas offline](https://maplibre.org/maplibre-react-native/docs/modules/offline-manager/).

## 8. Modelo de datos

IDs internos UUID; IDs externos se almacenan aparte. Toda entidad central lleva `agency_id`; las relaciones y consultas deben impedir cruces entre agencias.

| Entidad | Campos esenciales / relaciones |
|---|---|
| Agency | id, nombre, timezone, configuración y política de retención. |
| User / Membership | usuario, agencia, rol, estado; un usuario puede tener roles por agencia. |
| Device | id, usuario, agencia, clave pública, autorizado_at, revocado_at, versión. Clave privada protegida en el dispositivo. |
| Integration | agencia, proveedor, referencia a secreto servidor, estado y última conciliación. |
| SourceBooking | proveedor, external_booking_id, external_activity_booking_id, estado comercial, source_updated_at, snapshot mínimo. Unicidad por agencia/proveedor/ID. |
| Departure | producto origen, inicio, estado, responsable de guardia, package_version, route_version. |
| DepartureBooking | relación explícita entre salida y reservas; conserva trazabilidad de reprogramaciones. |
| Participant | id local, salida, referencia de reserva/viajero si existe, nombre mínimo, contacto autorizado opcional. No inventar nombres desde cantidades. |
| Subgroup | salida, nombre, guía responsable, writer_device_id, assignment_version. |
| Assignment | participante, subgrupo, versión, estado propuesto/confirmado/conflicto, evento de origen. Historial, no borrado silencioso. |
| RoutePackage | versión, geometría, hitos, protocolo versionado y manifiesto de recursos/checksums. |
| DownloadReceipt | dispositivo, paquete, versión, bytes, validación y fecha; no confundir con aceptación de guardia. |
| CommunicationPlan | salida, versión, zona horaria, canales, responsable, estado propuesto/aceptado/sustituido. |
| ContactWindow | plan, subgrupo, vencimiento UTC, tolerancia definida por operador, tipos de reporte que satisfacen el contacto, estado. |
| FieldEvent | id, salida/subgrupo, tipo, autor/dispositivo, sequence, base_version, occurred_at, recorded_at, received_at, posición opcional, precisión, payload_version y payload. |
| Attachment | evento, tipo, ruta local, hash, bytes, estado local/subiendo/recibido/error y referencia remota. |
| TransmissionAttempt | evento/reporte, transporte, intento, tiempos, resultado y error; no equivale a aceptación humana. |
| Report | id, event_ids, versión, texto canónico, hash y firma cuando corresponda. Puede ser parcial si faltan detalles/adjuntos. |
| Acknowledgment | evento/reporte, usuario responsable, accepted_at servidor, acción y nota. Recepción técnica se registra por separado. |
| FollowUp | incidencia/contacto, responsable, estado abierto/en seguimiento/resuelto, acciones y transferencia de dueño. |
| Outbox (local/servidor) | id, tipo, aggregate_id, payload, intentos, retry_after, estado y dependencias. |
| SyncCursor / AuditEntry | cursor emitido por servidor; acciones sensibles con actor y resultado. |

Relaciones principales:

```text
Agency → Departure → Subgroup → Assignment → Participant
                   → CommunicationPlan → ContactWindow
                   → FieldEvent → Attachment
                                → Report → TransmissionAttempt
                                         → Acknowledgment
SourceBooking ↔ Departure (DepartureBooking)
```

### Ejemplo de evento de cambio

```json
{
  "id": "<uuid>",
  "agencyId": "<uuid>",
  "departureId": "<uuid>",
  "subgroupId": "<uuid>",
  "type": "GROUP_TRANSFER_PROPOSED",
  "deviceId": "<uuid>",
  "sequence": 18,
  "baseAssignmentVersion": 3,
  "occurredAt": "2026-10-16T15:42:00Z",
  "recordedAt": "2026-10-16T15:43:00Z",
  "position": null,
  "schemaVersion": 1,
  "payload": {
    "participantIds": ["<uuid-1>", "<uuid-2>"],
    "toSubgroupId": "<uuid>",
    "reason": "Retorno acompañado"
  }
}
```

Ejemplo estructural con valores de referencia, no datos para producción. `receivedAt`, autorización y `acceptedAt` los asigna el servidor, no el remitente. Un segundo evento confirma o rechaza la transferencia; una propuesta no cambia por sí sola la responsabilidad confirmada.

## 9. Persistencia, sincronización y contratos

### Escritura local

1. Validar autor, asignación y formato.
2. Persistir evento + trabajo de outbox en una única transacción SQLite.
3. Para medios, escribir archivo persistente y comprobarlo antes de confirmar el adjunto. Fallos no deben perder el texto del evento.
4. Confirmar al usuario «guardado en este teléfono» solo después de persistir.

### Envío y reconciliación

- Envíos al menos una vez; recepción idempotente por `agency_id + event_id`.
- Un mismo ID con contenido diferente es un conflicto de integridad, no una actualización.
- HTTP, WhatsApp y transporte local conservan el mismo ID de reporte/evento.
- Reintentar con espera exponencial y jitter; errores de autorización requieren intervención, no bucles infinitos.
- Medios se envían después del resumen y muestran progreso independiente.
- `occurred_at` describe el hecho y puede tener reloj incorrecto. Orden por secuencia de dispositivo, versión y cursor servidor; nunca solo «última hora gana».
- No repetir la aceptación de eventos ya recibidos. Confirmaciones de transporte local no cuentan como recepción central.
- Planes y asignaciones con versión base incompatible producen un conflicto visible. Operaciones resuelve sin borrar versiones.
- Un reporte parcial no reconstruye detalles inexistentes. Indicar «detalle/medios pendientes».
- Descargas por manifiesto y checksum; conservar versión anterior hasta validar la nueva.
- La sincronización de fondo es oportunista. Permitir «sincronizar ahora» con la app abierta.

### API propia propuesta

| Endpoint | Contrato |
|---|---|
| `GET /v1/departures` | Filtrado por rol y agencia; paginado. |
| `GET /v1/departures/:id/package` | Snapshot versionado y manifiesto de descarga autorizado. |
| `POST /v1/departures/:id/plans` | Proponer plan con versión base; no aceptación implícita. |
| `POST /v1/plans/:id/accept` | Responsable autorizado acepta versión exacta. |
| `POST /v1/events/batch` | Resultado individual: recibido, duplicado, conflicto o rechazado. |
| `GET /v1/sync?cursor=...` | Cambios incrementales con cursor opaco emitido por servidor. |
| `POST /v1/reports/:id/acknowledgments` | Aceptación humana idempotente; actor de la sesión autenticada. |
| `POST /v1/attachments/uploads` | Inicio de carga autorizada y validación posterior de tamaño/hash. |
| `POST /v1/departures/:id/close-requests` | Solicitud; cierre efectivo solo tras validaciones y aceptación. |
| `POST /webhooks/bokun` | Autenticación/verificación conforme al mecanismo oficial elegido; encolar y responder rápido. |
| `GET/POST /webhooks/whatsapp` | Verificación oficial de endpoint y firma; encolar mensajes y estados. |

Estos endpoints son nuestros, no rutas atribuidas a los proveedores. Pruebas de contrato fijarán esquemas, errores y paginación antes de implementar pantallas.

## 10. Bókun: alcance de integración

Usar API autorizada disponible para la cuenta del operador. No dar por hecho un OAuth universal ni acceso idéntico en todos los planes/cuentas.

1. Conectar desde operaciones y verificar permisos servidor a servidor.
2. Importar reservas/productos/fechas y campos de viajeros/recogidas realmente disponibles.
3. Agrupar por salida operativa y revisar excepciones de producto, horario o reprogramación.
4. Recibir webhooks de creación, actualización y cancelación; recuperar detalles actuales mediante la API correspondiente.
5. Conciliar periódicamente por si faltan avisos; respetar paginación y límites documentados.
6. Informar cambios posteriores a una descarga; no borrar el historial operativo.

Bókun es la fuente comercial. Salida Lista es la fuente del registro de campo y aceptación. Un pago o reserva confirmados no equivalen a presencia ni a retorno. La documentación oficial enumera `bookings/create`, `bookings/update` y `bookings/cancel`; los IDs deben tratarse según la API utilizada, sin asumir que GraphQL y REST usan referencias intercambiables. [Webhooks Bókun](https://bokun.dev/webhooks/g3YWZ24sADsceKK5vqrMzZ/webhook-events/migR39DGTnTr3qaRryEr7k), [API oficial](https://api-docs.bokun.dev/).

**Prueba de aceptación:** una reserva real autorizada, con datos de prueba o consentimiento, aparece una sola vez; actualización/cancelación se reflejan sin eliminar eventos de campo. Si la cuenta no permite la integración requerida, es una dependencia bloqueante del conector, no se sustituye silenciosamente por una maqueta.

## 11. WhatsApp y seguridad

### Camino normal

App genera parte → guía lo envía → número empresarial autorizado → webhook → validación → bandeja móvil de Carla → aceptación humana.

- Business Platform oficial y número configurado; tokens solamente en servidor.
- Mensajes iniciados por la empresa respetan consentimiento, plantillas y ventana de atención aplicables. [Política oficial](https://business.whatsapp.com/policy).
- Validar firma del webhook y deduplicar por ID del proveedor.
- Relacionar remitente con usuario/dispositivo/salida autorizados. No confiar en un `agencyId` escrito en texto.
- Un texto reenviado o editado no puede reasignar participantes automáticamente. Los comandos con efectos requieren autenticación/firma y versión válida; si no, quedan como parte por revisar.
- Un parte compacto puede transportar un resumen firmado y referencias, no necesariamente el evento completo. QR y Nearby usan un sobre versionado autenticado; la llave pública se descarga antes de salir.
- Firmas y revocación no aseguran que un equipo comprometido sea honesto. La revocación offline tiene límites y debe quedar visible; resolver casos dudosos con intervención humana.
- No incluir por defecto nombres completos, documentos o información médica en partes de baja conectividad.
- Recepción por webhook ≠ lectura ≠ aceptación. Un acuse automático nunca firma «Carla aceptó».
- Sin API accesible en el celular, el acuse puede verse solo en WhatsApp hasta reconciliar.

### Formato humano mínimo

```text
SL1 · salida SL-024 · parte <id>
Hecho: 16/10 10:42 -05:00
Tipo: CAMBIO DE GRUPO
A: 6 con Luis / B: 2 con Ana
Posición: [lat,lon] o NO DISPONIBLE
Solicita: confirmar seguimiento
Código de integridad: [generado por la aplicación]
```

El código es ilustrativo: su formato criptográfico y tamaño se fijan con pruebas del canal y revisión de seguridad; no equivale a una contraseña compartida. Mensajes incompletos o inválidos entran a revisión, nunca se descartan sin trazabilidad ni producen una aceptación automática.

### Privacidad y acceso

- Acceso por agencia, salida y rol; guía ve solo salidas asignadas.
- Cifrado en tránsito; protección local de BD, archivos y llaves; no registrar secretos ni datos sensibles en logs.
- Retención configurable y borrado local al concluir el plazo acordado, sin romper una salida activa; política central y copias de respaldo definidas antes del piloto.
- Sin ubicación continua fuera de la salida; solicitud gradual de permisos y explicación visible.
- Antes de la salida, provisionar autorización offline limitada a dispositivo, salida, rol y fecha de expiración. Guardarla protegida; no depender de refrescar un token cada vez que se abre el mapa. Una sesión vencida no borra registros pendientes: permite recuperarlos, pero no otorga nuevas facultades. La revocación remota solo llega al dispositivo cuando recupera un canal; esta limitación debe informarse al operador.
- Revisar obligaciones peruanas de datos personales y transferencias con asesoría competente antes de producción. Este documento no acredita cumplimiento legal.

## 12. Pruebas de WhatsApp satelital en Perú

**Objetivo:** comprobar si un guía puede enviar un parte compacto y recibir respuesta humana sin cobertura terrestre, mediante una combinación concreta de equipo, plan y servicio. No demostrar «cobertura universal».

Entel publica D2C para equipos y planes compatibles, con condiciones de cielo, disponibilidad y territorio. WhatsApp tiene funciones limitadas: no incluye documentos, llamadas ni ubicación en vivo. La API propia no se considera una app habilitada por defecto. Verificar elegibilidad y condiciones nuevamente antes de cada campaña; las condiciones comerciales publicadas incluyen promoción hasta el 31/12/2026. [Entel, fuente oficial consultada el 16/10/2026](https://www.entel.pe/Starlink).

### Preparación

- Elegir un Android y un iPhone explícitamente compatibles con datos D2C, no solo SMS; registrar modelo, SO, operador, plan y ajustes exigidos. Desactivar Wi-Fi y la salida de datos de cualquier segunda SIM durante el ensayo satelital para no atribuir a D2C una entrega por otra red.
- Número Business Platform real y receptor de operaciones con conectividad estable.
- Datos ficticios, salida marcada PRUEBA y consentimiento de los participantes del ensayo.
- Itinerario de prueba accesible, acompañado y con medio de comunicación independiente. No generar emergencias ni usar números de emergencia.
- WhatsApp instalado y configurado; paquete y credenciales offline preparados antes de salir.
- Verificar condiciones del proveedor, configuración y señalización D2C; guardar evidencia sin datos sensibles.

### Protocolo por dispositivo

| ID | Prueba | Qué registrar |
|---|---|---|
| SAT-01 | En red terrestre, parte de control. | Tiempo de compartir, recepción webhook, aparición en guardia y aceptación humana. |
| SAT-02 | En lugar sin servicio terrestre, Wi-Fi apagado y servicio D2C disponible. | Evidencia del canal según teléfono/proveedor, hora, lugar, cielo y disponibilidad observada. |
| SAT-03 | Enviar texto corto y parte operativo compacto, diez intentos de cada uno repartidos en sesiones. | Entregas, fallos, demoras, modificaciones, duplicados y batería. No confundir 20 mensajes con representatividad nacional. |
| SAT-04 | Carla responde/acepta desde canal autorizado. | Ida y vuelta: webhook, aceptación humana, recepción en WhatsApp del guía y posterior reconciliación en app. |
| SAT-05 | API propia inaccesible mientras WhatsApp funciona. | App mantiene estado pendiente y permite parte manual, sin suponer acceso IP general. |
| SAT-06 | Cortar disponibilidad durante envío; reenviar y luego recuperar internet normal. | Un solo evento lógico, intentos conservados y ninguna pérdida silenciosa. |
| SAT-07 | Texto con coordenadas y hora; sin GNSS disponible. | Campos se transmiten o ausencia explícita; no depende de ubicación en vivo. |
| SAT-08 | Mensaje editado, incompleto o reenviado por otro número. | Revisión visible, sin modificar asignaciones ni generar aceptación humana falsa. |

**Modo avión no prueba D2C:** normalmente desactiva la radio celular que necesita el servicio. Tampoco basta apagar los datos y afirmar que se está usando satélite. Si no se logra identificar razonablemente el transporte, etiquetar el resultado «canal no verificado», no «éxito satelital».

### Métricas y puerta de decisión

Registrar `t_creación`, `t_usuario_envía`, `t_webhook`, `t_visible_operaciones`, `t_aceptación` y `t_retorno_guía`. Separar latencia humana y transporte; usar relojes sincronizados y registrar desajustes. Reportar mediana, rango, percentiles solo con muestra suficiente y proporción sin entrega al terminar la observación.

Objetivo provisional del piloto: al menos 90% de partes de texto recibidos dentro de 10 minutos, medidos en las condiciones ensayadas. Es un umbral de decisión de producto por negociar con la agencia, **no una garantía de Entel ni un tiempo adecuado para toda emergencia**. Si falla, no se vende D2C como canal principal; mantenerlo como alternativa condicionada y revisar otro respaldo.

No detectar automáticamente D2C por un simple indicador de conectividad. La app distingue «API alcanzable/no alcanzable»; la comprobación del canal del operador puede requerir revisión humana.

## 13. Pruebas teléfono–teléfono sin internet

**Objetivo:** transferencia asistida de un parte autenticado entre dos móviles próximos; el receptor conserva y reenvía cuando consiga un canal. Nearby ofrece comunicación local, no internet ni enrutamiento multihop automático. [Google Nearby Connections](https://developers.google.com/nearby/connections/overview).

### Prototipo separado del núcleo

1. Compilar módulo nativo Nearby en development builds Android/iOS.
2. Probar Android↔Android, iPhone↔iPhone y Android↔iPhone con dispositivos reales: al menos dos Android de fabricantes distintos y dos iPhone. Invertir roles anunciante/buscador y registrar SO, build y versión del SDK.
3. Ambos abren «Conexión local», seleccionan el dispositivo y verifican el código de autenticación.
4. Emisor envía sobre versionado con ID, hash, firma y contenido mínimo.
5. Receptor valida y persiste; solo entonces emite recibo local.
6. Receptor recupera internet y reenvía. Servidor atribuye autor original y transportista por separado.
7. El autor original recibe confirmación central cuando pueda sincronizar.

Verificar permisos y capacidades vigentes de Bluetooth, red local, ubicación y Wi-Fi/hotspot según plataforma; no asumir que basta instalar un paquete JavaScript. [Configuración oficial Nearby para iOS](https://developers.google.com/nearby/connections/swift/get-started).

### Matriz mínima

| ID | Condición | Resultado que se exige |
|---|---|---|
| LOC-01 | Sin SIM o datos; Wi-Fi sin internet y Bluetooth activos. | Transferencia sin backend; no se necesita un hotspot con salida. |
| LOC-02 | Modo avión con Wi-Fi/Bluetooth reactivados, según permita el teléfono. | Repetir; documentar limitaciones del SO. Este caso prueba transporte local, no satélite. |
| LOC-03 | Sin WAN en ambos, servidor inaccesible. | Recepción local funciona y no se etiqueta como recepción central. |
| LOC-04 | Distancias 1, 5, 10 y 20 m en entorno abierto; repetir con obstáculos seguros. | Medir disponibilidad y tiempo; no publicar esas distancias como alcance garantizado. |
| LOC-05 | Pantalla bloqueada, app en fondo y proceso terminado. | Medir cada caso por modelo; si se interrumpe, estado claro y reconexión manual. No prometer recepción pasiva. |
| LOC-06 | Permiso denegado o radio apagada. | Explicación recuperable y alternativa QR; sin bloqueo de la salida offline. |
| LOC-07 | Corte a mitad, reintento, reinicio y duplicados. | No confirmar datos no persistidos; mismo evento no se duplica. |
| LOC-08 | Par no autorizado, firma inválida o paquete demasiado grande. | Rechazo o cuarentena; límites de tamaño y validación. |
| LOC-09 | Receptor reenvía y autor también envía por API/WhatsApp. | Una entidad lógica; auditoría conserva transportes y autor original. |
| LOC-10 | Batería antes/después y repetición de sesión. | Consumo registrado; no escaneo indefinido por defecto. |

Realizar al menos diez transferencias por par de modelos y dirección con app en primer plano. Puerta inicial: al menos 95% de sobres de hasta 4 KB confirmados localmente en 30 segundos a 5 m en entorno controlado, y ningún caso de confirmación sin persistencia o duplicación lógica. Es un objetivo propio; el ensayo de terreno puede invalidarlo. Si el transporte falla o consume demasiado, conservar QR y posponer Nearby.

**Límite operativo:** quien retransmite debe estar autorizado. No crear un «teléfono mula» silencioso con datos personales. Ni QR ni Nearby encuentran a una persona ausente fuera de alcance.

## 14. Pruebas del núcleo y criterios de aceptación

| Área | Condición para aceptar |
|---|---|
| Importación | Crear, modificar, reprogramar y cancelar reservas de prueba sin duplicar salida ni borrar historial. |
| Offline | Tras descarga validada, consultar mapa/lista/protocolo y crear 100 eventos durante una jornada sin API. Todos sobreviven al reinicio. |
| Archivos | Poco espacio, cierre durante captura y archivo corrupto no producen un adjunto falsamente guardado; texto recuperable. |
| Sincronización | Envío repetido y por varios transportes produce una sola entidad; contenido contradictorio queda en conflicto. |
| Tiempo | Cambiar reloj del teléfono no pospone plazos del servidor ni reordena falsamente asignaciones. |
| Plan | Cambio offline de contacto no altera el plan central hasta recepción y aceptación autorizadas. |
| Asignaciones | Dos propuestas contradictorias no dejan al mismo participante en dos grupos confirmados sin alarma visible. |
| Ubicación | Permiso denegado, precisión baja, ausencia de GNSS y cierre forzado muestran degradación; nunca inventan posición. |
| Guardia | Plazo vencido genera tarea «verificar contacto», con responsable y auditoría; no declara desaparición. |
| Seguridad | Un usuario de otra agencia no accede por ID adivinado, enlaces, medios ni endpoints de sincronización. |
| WhatsApp | Abrir/cancelar compartir nunca produce «recibido»; webhook repetido no duplica; mensaje falso no autoriza acciones. |
| Cierre | Participantes no conciliados y acciones abiertas impiden cierre ordinario; excepción solo con autorización/motivo auditables. |

Pruebas unitarias de reglas y validadores; integración de SQLite, servidor y conectores; contratos de API; pruebas E2E en dispositivos físicos. Una interfaz demostrativa no acredita integración funcional.

### Batería y rendimiento

Medir una jornada de ocho horas con el patrón esperado: mapa consultado por intervalos, eventos y ubicación configurada. Comparar con un día base del mismo teléfono, anotar batería inicial/final, power bank, temperatura y frecuencia de muestras. Primero establecer línea base; después acordar presupuesto de consumo. No fijar una autonomía universal sin medición.

### Observabilidad

Medir cola pendiente/antigüedad, errores de importación, recepción→aceptación, contactos sin responsable, fallos de descarga y porcentaje de sesiones sin posición. Alertar fallos del worker y webhooks. Logs con IDs técnicos y datos mínimos; acceso auditado. Push, WhatsApp y una persona de respaldo no deben compartir un único punto de fallo sin que el operador lo conozca.

## 15. Orden de construcción y piloto

### Fase 0 — Reducir incertidumbre de integración

- Cuenta Bókun autorizada: probar acceso y campos reales.
- Número WhatsApp empresarial configurado: verificar envío, recepción, firma y políticas.
- Builds Android/iOS: mapa offline, SQLite, reinicio y permisos.
- Prototipo D2C/Nearby independiente: obtener resultados antes de comprometer promesas.

### Fase 1 — Recorrido vertical funcional

Una reserva de Bókun → salida descargada → evento offline → parte real → recepción en operaciones → aceptación humana → reconciliación → cierre. Primero texto y posición; después adjuntos y casos complejos.

### Fase 2 — Operación completa del MVP

Participantes, transferencias, planes versionados, guardia, reintentos, permisos, seguridad multiagencia y pruebas de fallo. QR firmado para transferencia presencial; Nearby solo si supera su puerta de aceptación.

### Fase 3 — Piloto supervisado

Propuesta: una agencia, dos guías y una responsable; primero simulaciones cercanas y después varias salidas reales con el procedimiento actual en paralelo. El producto no sustituye equipos ni protocolos existentes durante el piloto.

Medir tiempo de preparar la salida y cerrar informe, proporción de partes recibidos/aceptados, fallos de persistencia, contactos vencidos gestionados, batería y uso por guías. Comparar con la operación anterior, no solo con una encuesta de satisfacción.

**Decisión comercial:** continuar si el operador reconoce mejora medible y acepta pagar por el siguiente periodo. No inferir disposición a pagar únicamente porque ya compra teléfonos o equipos de seguridad. El piloto debe presupuestar número empresarial/mensajería, hosting/almacenamiento, mapas, planes móviles, dispositivos de prueba, soporte y campo.

### Dependencias que faltan para implementar en producción

- Agencia piloto y autorización de integración.
- Credenciales y permisos Bókun, número Business Platform y configuración de Meta.
- Cuentas de distribución iOS/Android y dispositivos físicos.
- Cartografía descargable con licencia y protocolo del operador.
- Backend/almacenamiento provisionados, política de datos y revisión de seguridad.
- Equipos/planes D2C elegibles y lugar seguro para ensayos.

## 16. Decisiones abiertas y límites de este documento

| Decisión | Cuándo resolver |
|---|---|
| Proveedor de identidad, hosting, mapas y archivos | Antes de provisionar; evaluar costes, permisos y residencia/retención. |
| Ruta final de autorización Bókun | Tras comprobar cuenta y API disponible. |
| Formato exacto del sobre firmado/QR y parte WhatsApp | Prototipo de tamaño/usabilidad y revisión de seguridad. |
| Modelos/SO admitidos y frecuencia de ubicación | Ensayos físicos y presupuesto de batería. |
| Ventanas de comunicación y política de excepción | Con la agencia; no imponer plazos de seguridad genéricos. |
| Nearby en lanzamiento | Solo si pasa pruebas de interoperabilidad y uso real. |

No se ha escrito ni ejecutado una aplicación, conectado cuentas ni realizado pruebas satelitales/locales al producir este documento. Los porcentajes son umbrales propuestos de evaluación, no resultados. Esta definición permite comenzar implementación sin confundir hipótesis, dependencias y capacidades demostradas.

## Key Learnings:

1. El estado comercial de una reserva, el estado local de una salida y la aceptación de operaciones son fuentes distintas.
2. Offline requiere persistencia, versiones y resolución de conflictos; no basta con cachear pantallas.
3. WhatsApp satelital y Nearby deben probarse como transportes diferentes: uno puede comunicar a distancia bajo condiciones; el otro conecta dispositivos próximos.
4. Ninguna confirmación de transporte sustituye la aceptación humana de responsabilidad.
