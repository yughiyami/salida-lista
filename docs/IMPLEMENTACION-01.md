# Incremento 01 — Flujo del guía local

## Decisiones ejecutadas

- Aplicación en `mobile/`, Expo SDK 58 y React Native 0.88, TypeScript y Expo Router conforme a `mobile/AGENTS.md`.
- SQLite con migración versionada y datos ficticios. Eventos + outbox en transacción exclusiva; presencia y checklist con auditoría local.
- Guía puede consultar ficha, marcar presencia, preparar salida, capturar posición puntual, guardar eventos y compartir partes.
- Captura GNSS con espera acotada: si no llega posición, puede guardar sin ella. No seguimiento de fondo.
- Ningún estado simula importación, comunicación, recepción o aceptación remota.
- Imágenes conceptuales generadas aparte; componentes nativos, no screenshots usados como botones.

## Diferencias respecto del MVP completo

Este es un recorrido vertical **local**, no el MVP comercial terminado. No hay backend ni identidad, SQLCipher, cartografía real descargada, operaciones, grupos transferibles, cierre central o conectores de proveedor. Los datos se pierden si se desinstala/borra la app. El modo demo es deliberado porque no hay cuentas autorizadas disponibles; no sustituye una conexión de producción.

## Verificación realizada

- Siete pruebas automatizadas del dominio/repositorio con SQLite real de Node: validación, reportes, migración idempotente, 100 eventos al reabrir, atomicidad/rollback y versión futura.
- TypeScript y lint ejecutados.
- Exportación de bundles para Android e iOS.
- Expo Doctor: 20/20 comprobaciones pasaron.

No se ejecutó app en teléfono/emulador en este entorno; no se generó APK/IPA ni se conectaron cuentas. Tampoco se probaron WhatsApp, D2C, QR o Nearby en campo. La prueba de escritorio no acredita el lifecycle nativo: el checklist físico del README sigue pendiente.

## Dependencias y gotchas

Expo Router introdujo un peer `react-dom` que npm intentó resolver a una revisión distinta de React. Se fijó la versión compatible mediante `expo install react-dom`, sin `--force` ni `--legacy-peer-deps`.

Hay alertas de auditoría de dependencias todavía abiertas, documentadas en README e informe JSON. No se debe degradar Expo a ciegas para conseguir un contador cero. El prototipo usa datos ficticios y no debe tratar información real hasta resolver seguridad, identidad y protección local.

## Próximo incremento

1. Ejecutar pruebas offline en APK interna con bundle embebido.
2. Provisionar backend/identidad y una cuenta Bókun autorizada.
3. Conectar outbox con recepción idempotente y pantalla móvil de operaciones.
4. Provisionar WhatsApp Business Platform y verificar webhook/acuse antes de ampliar canales.
5. Añadir cartografía licenciada, almacenamiento protegido y pruebas de campo separadas.

## Key Learnings:

1. Guardar un evento y su outbox en la misma transacción evita falsos guardados incompletos.
2. El modo offline físico exige verificar arranque con bundle embebido, no solo desconectar el ordenador que sirve Metro.
