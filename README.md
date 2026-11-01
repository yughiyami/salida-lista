# Salida Lista

Primer incremento **móvil** del flujo del guía, React Native + Expo SDK 58 + Expo Router + SQLite. Prototipo funcional local con datos ficticios, no un sistema de seguridad listo para producción.

**Actualización 16/10/2026:** app ejecutada en emulador Android con APK release x86_64. Se verificaron eventos, presencia y checklist después de forzar cierres sin red. [Capturas, resultados y diferencias visuales](docs/PRUEBA-ANDROID-2026-10-16.md). No acredita pruebas en teléfono físico ni iOS.

**Refinamiento visual posterior:** foto real local de Salkantay y Registrar evento fijo sin scroll. [Capturas históricas](docs/UI-VISUAL-02.md). El esquema se sustituye por MapLibre con cartografía OSM local y GPS en primer plano: [alcance y prueba nativa](docs/MAPLIBRE-OFFLINE-03.md).

**APK para celular 1.0.1:** generada y verificada estáticamente para ARM64 y x86_64, con iconos SVG y nueva marca local. La instalación y el GPS real se registran por separado en la [guía de prueba Android](docs/PRUEBA-CELULAR-ANDROID-04.md).

## Ejecutar

Requisito para las pruebas de repositorio: Node 24. Dependencias fijadas en `mobile/package-lock.json`.

```powershell
cd D:\proyectos\react_test\mobile
npm ci
npm start
```

Abrir en un dispositivo/entorno compatible con SDK 58. Metro sirve para desarrollo; no acredita arranque totalmente offline. No hay experiencia web objetivo ni dashboard web.

Para un APK interno con JavaScript embebido, después de asociar el proyecto a tu cuenta Expo y configurar firma:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

El perfil está definido; **no se ha solicitado ni generado un build EAS**. La primera configuración puede pedir autenticación/asociación del proyecto. iOS físico requiere provisionamiento Apple. Si usas SDKs nativos adicionales, necesitarás reconstruir la app.

## Lo que está construido

- Siete rutas: salidas, preparación, recorrido, participantes, evento, partes y conexiones.
- Presencia y checklist persistentes, con auditoría local.
- Evento de tipo hito/demora/incidencia/retorno con texto y posición opcional.
- Cartografía nativa MapLibre incluida de Soraypampa/Salkantay/Wayramachay, disponible sin descarga previa.
- GPS opcional en primer plano, precisión, hora y aviso de posición antigua o fuera del área; se detiene al salir o pasar al fondo. Captura puntual independiente para eventos.
- Transacción atómica para evento + outbox, sin inventar envíos al servidor.
- Partes de texto compartibles; el usuario puede elegir WhatsApp.
- Errores visibles y reintento de apertura sin borrar la base.

### Lo que NO está conectado o terminado

Bókun, WhatsApp Business Platform, backend/identidad, aceptación de operaciones, sincronización remota, gestor de nuevas regiones y navegación giro a giro, división/transferencia de grupos, fotos/audio, QR/Nearby, satélite y cierre central. La cartografía incluida es parcial, limitada al paquete piloto y sin relieve ni garantía de transitabilidad. No se registra un acuse porque el usuario abra WhatsApp.

**Solo usar datos ficticios:** la base no tiene cifrado adicional ni autenticación implementada. La información local puede perderse al desinstalar/borrar datos; aún no hay copia remota. No usar para guiar una emergencia ni sustituir procedimientos/equipos existentes.

## Verificación automatizada

```powershell
npm test
npm run typecheck
npm run lint
npm run export:native
```

Los tests ejecutan las reglas y el repositorio TypeScript contra SQLite real de Node: persistencia de 100 eventos al cerrar/reabrir archivo, outbox atómica, rollback, migración, validación y partes. **No prueban el puente nativo Expo, UI física, permisos ni WhatsApp.** La exportación genera bundles JS de Android/iOS, no un APK/IPA.

### Dependencias: pendiente antes de producción

`npm audit` reporta 28 alertas (20 altas, 8 moderadas), tras incorporar MapLibre en la cadena de dependencias. Se aplicó `npm audit fix --ignore-scripts` sin forzar cambios incompatibles; persisten alertas transitivas de `braces`, `node-forge` y `uuid` y sus dependientes. La corrección forzada propuesta incluye degradar Expo/React Native a versiones incompatibles: **no se aplicó**. No se considera una entrega apta para producción hasta evaluar exposición y correcciones compatibles. Mantener Metro en un entorno de desarrollo de confianza, no exponerlo públicamente. El informe JSON local está en `mobile/audit-report.json`; no contiene credenciales.

## Probar offline en un teléfono

1. Instalar build interna con bundle embebido; abrir la salida de demostración.
2. Marcar presencia y preparación; crear un evento sin ubicación.
3. Desactivar red/datos. Crear más eventos; verificar partes y ficha local.
4. Cerrar la app y volver a abrir SIN Metro; confirmar que eventos, presencia y checklist permanecen.
5. Capturar posición con servicios habilitados. Si no llega/permiso denegado, guardar sin posición.
6. Abrir compartir, cancelar y volver: nada debe marcarse como recibido.
7. Recuperar conectividad, compartir a un contacto de prueba y verificar manualmente allí. La app debe seguir mostrando pendiente local.

No llamar servicios de emergencia ni enviar datos reales en pruebas. Modo avión no demuestra WhatsApp satelital ni una malla local; consultar el plan específico del documento MVP.

## Interfaces generadas

Tres imágenes, seis pantallas conceptuales, generadas con `image_gen` integrado:

- [Salidas y preparación](docs/design/01-salidas-preparacion.png)
- [Ruta y participantes](docs/design/02-ruta-participantes.png)
- [Eventos y partes](docs/design/03-eventos-pendientes.png)

Los prompts completos están en `docs/design/prompts.json`. **Son propuestas visuales, no capturas de la app ni evidencia de mapas, guardia o conexiones implementadas.** La app traduce esa dirección visual a componentes nativos; no usa las imágenes como pantallas clicables.

## Documentos

- `docs/SALIDA-LISTA-MVP.md`: alcance completo, datos, arquitectura y pruebas de campo.
- `docs/CONEXIONES-Y-CREDENCIALES.md`: qué cuentas y permisos faltan; secretos siempre servidor.
- `docs/server.env.example`: plantilla futura sin valores ni backend operativo.

## Key Learnings:

1. El primer incremento persiste eventos y outbox de forma atómica, sin simular recepción remota.
2. Una exportación de bundles y una prueba SQLite de escritorio no sustituyen los ensayos en dispositivos físicos.

## Actualización 1.0.2 — Arequipa y campo libre

APK interna: `D:\proyectos\react_test\artifacts\android\SalidaLista-1.0.2-Android.apk`.
Incluye extractos OSM offline de Arequipa centro, Yanahuara, Chivay/Yanque, Cruz del Cóndor y Salkantay; permite mover cámara y centrar GPS reciente fuera del paquete, sin bloquear eventos ni asistencia. No cubre todo el departamento y cambiar mapa no cambia el grupo demo.

TypeScript, lint y 11 pruebas PASS; compilación, firma/estructura y actualización USB en Samsung PASS. En ese Samsung se verificaron en modo avión, Wi-Fi desactivado y sin red activa tres eventos y ocho estados de asistencia idénticos tras forzar detención y reabrir **en 1.0.1**; el mapa Salkantay también se renderizó offline. La comparación posterior a actualizar a 1.0.2 y sus mapas nuevos se documenta separadamente para no trasladar aprobaciones entre builds.

Resultados detallados: `D:\proyectos\react_test\docs\PRUEBA-AREQUIPA-05.md`.
Fuentes cartográficas ODbL: `D:\proyectos\react_test\artifacts\android\SalidaLista-1.0.2-fuentes-mapas.zip`.

### Resultado físico 1.0.2 confirmado

En el Samsung se renderizaron sin red los cinco mapas locales, se conservaron los tres eventos tras actualizar y se creó un cuarto sin GPS. Tras forzar detención/reabrir la versión 1.0.2, los cuatro IDs/descripciones/horas visibles y los ocho estados de asistencia permanecieron iguales (3 presentes). Modo avión, Wi-Fi disabled y sin red predeterminada antes/después. Evidencia final en `D:\proyectos\react_test\docs\evidence\android-arequipa-1.0.2\physical-result-1.0.2.json`. GPS offline real/centrado fuera de cobertura del Samsung siguen pendientes.
