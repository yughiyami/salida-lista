# Salida Lista

Prototipo móvil offline para guías turísticos en Perú: consulta cartografía local,
registra hitos e incidencias y conserva la asistencia aunque no haya internet.
El objetivo es complementar la operación de campo, no duplicar un motor de reservas.

**Estado:** código 1.0.3 (versionCode 4), con cartografía nacional referencial y
Arequipa metropolitana incorporadas. La APK 1.0.3 está en compilación y aún no
tiene validación física; la versión Android 1.0.2 sí fue probada. No es un producto de rescate ni un servicio
que garantice localizar personas. Usar únicamente participantes ficticios durante
la evaluación: aún faltan autenticación, cifrado y controles de producción.

## Qué funciona hoy

- Flujo del guía: preparar salida demo, mapa, participantes, registrar evento y
  consultar partes locales. Botón Registrar evento visible sin desplazar la página.
- SQLite local para asistencia y eventos; evento y entrada en la cola local se
  guardan de forma atómica. Pendiente local **no significa enviado**.
- Siete paquetes cartográficos embebidos en el código 1.0.3: Perú referencial,
  Arequipa metropolitana y los cinco anteriores (Arequipa centro, Yanahuara,
  Chivay/Yanque, Cruz del Cóndor y Salkantay). No requieren descargar mapas
  durante el uso ni dependen de una caché de tiles.
- GPS opcional con permiso explícito, solo mientras la pantalla está activa:
  precisión, antigüedad y aviso fuera de cobertura. No hay seguimiento de fondo.
- Operación fuera del mapa: eventos y asistencia no requieren GPS ni estar dentro
  de una ruta. Es posible desplazarse y centrar una posición reciente fuera del
  paquete; donde no hay datos aparece fondo sin cartografía.
- Compartir un parte mediante el selector del sistema, incluido WhatsApp si está
  instalado. No confirma entrega ni envía mensajes sin conectividad.

**Cobertura y límites:** Perú referencial (1.668.426 bytes) incluye vías
motorway/trunk/primary generalizadas, 548 ciudades/pueblos y un contorno nacional
Natural Earth: 552 objetos agrupados en total. No contiene todas las calles,
carreteras ni senderos; su simplificación de 0,003° impide usarlo como trazado para
seguir a pie. El contorno es referencial, no una delimitación legal u oficial.

Arequipa metropolitana (3.475.228 bytes) cubre un rectángulo aproximado de 32 × 30 km:
`[-71.68, -16.52, -71.38, -16.25]` (oeste, sur, este, norte). Incluye vías/senderos
y agua agrupados por clase, sin edificios ni nombres y restricciones de cada vía.
**No cubre todo el departamento de Arequipa.** Los otros cinco paquetes siguen
siendo extractos parciales. No hay relieve, navegación giro a giro ni certificación
de transitabilidad. Cambiar mapa no cambia el grupo demo Salkantay.
Ver [datos, manifiestos y procedencia](assets/maps/README.md).

## Validación y pendientes

En un Samsung físico se comprobó, en modo avión y con Wi-Fi apagado, que los cinco
mapas se dibujan y que cuatro eventos de prueba conservaron IDs, textos y horas
tras forzar cierre y reabrir; los ocho estados de asistencia conservaron tres
presentes. La actualización a 1.0.2 conservó los datos. Esto no demuestra GPS
satelital offline en ese dispositivo ni cobertura nacional.

Pendientes: GPS offline de campo y fuera de cobertura en distintos dispositivos;
salidas y grupos reales; sincronización; controles de privacidad y seguridad.
Android tiene pruebas físicas; iOS requiere compilación y validación propias.

**Seguridad pendiente:** la última auditoría local registró 28 alertas de
dependencias (20 altas y 8 moderadas). Deben evaluarse con compatibilidad de
Expo/RN; no aplicar `npm audit fix --force` sin revisión. El prototipo no está
aprobado para producción ni para almacenar datos personales reales.

## Ejecutar

Requiere Node.js compatible con Expo SDK 58, npm y entorno nativo Android o iOS.
MapLibre contiene código nativo: **no funciona en Expo Go**.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run android
# En macOS con Xcode:
npm run ios
```

`npm test` ejecuta pruebas de persistencia y datos cartográficos;
no sustituye pruebas físicas de GPS ni una revisión completa de seguridad.
Para arrancar Metro tras instalar una compilación nativa: `npm start`.
La configuración nativa se genera con Expo CNG a partir de `app.json` y `plugins/`;
no editar manualmente carpetas nativas generadas. Al añadir dependencias usar
`npx expo install <paquete>` para resolver compatibilidad con SDK 58.

### Windows: regeneración nativa

Si después de Expo CNG una compilación falla porque falta `ShadowNodes.h`,
regenerar primero los artefactos de codegen desde la raíz del proyecto:

```powershell
.\android\gradlew.bat -p android generateCodegenArtifactsFromSchema
.\android\gradlew.bat -p android app:assembleRelease
```

Usar el JDK y Android SDK compatibles con el proyecto. No corregir el problema
editando cabeceras ni código dentro de carpetas nativas generadas.

## Preparar cartografía (opcional, no necesario para ejecutar)

Los GeoJSON derivados se versionan. El PBF nacional de Geofabrik (~244,7 MiB),
la fuente mundial Natural Earth y el entorno Python **no entran en Git ni APK**.
Para regenerarlos, descargar las fuentes en `.cache/maps/` siguiendo las URLs y
comandos de [la documentación cartográfica](assets/maps/README.md), y ejecutar:

```powershell
python -m venv .venv-maps
.\.venv-maps\Scripts\python.exe -m pip install osmium==4.3.1 shapely==2.1.2
.\.venv-maps\Scripts\python.exe scripts/prepare-peru-maps.py
npm test
```

Entradas: `.cache/maps/peru-latest.osm.pbf` y
`.cache/maps/ne_10m_admin_0_countries.geojson` (Natural Earth v5.1.2).
Los manifiestos conservan hashes SHA256, fecha, filtros, conteos y tamaño de las
fuentes y derivados. `latest` puede cambiar: los mismos bytes requieren el mismo
hash, no solo repetir la URL. El proceso no añade dependencias Python a la app.

## Arquitectura

- React Native 0.88, React 19.3, Expo SDK 58 y Expo Router.
- `src/app/`: rutas; `src/ui/`: pantallas y mapa MapLibre.
- `src/data/`: SQLite y acceso al estado local; `src/domain/`: modelos y reportes.
- `assets/maps/`: bases derivadas, originales pequeños y manifiestos; fuentes
  nacionales grandes solo en caché local ignorada.
- `scripts/` y `tests/`: conversión reproducible y validaciones.

## Bókun y WhatsApp

**Aún no hay conexión con Bókun ni con WhatsApp Business Platform.** No se necesitan
credenciales para ejecutar el demo offline. `.env.example` es solo documentación;
el incremento actual no consume esas variables.

La futura integración requiere backend: claves de acceso y secreto de Bókun según
el acceso autorizado del operador; para WhatsApp, cuenta empresarial, número/ID,
token de acceso, secretos y validación de webhooks según el despliegue Meta.
Esos secretos jamás deben ir en la app, en `EXPO_PUBLIC_*`, commits ni APK.
Compartir manualmente un texto no equivale a integrar la API de WhatsApp.

## Prioridades

Ver [ROADMAP](ROADMAP.md): cobertura offline por capas con énfasis Arequipa,
GPS real fuera de ruta, múltiples salidas, sincronización idempotente y
comunicación verificable. Sin red, registrar es posible; transmitir a otros no.
No se promete mesh, satélite ni localización automática de familiares.

## Licencias

El aviso MIT del template Expo se conserva en [LICENSE](LICENSE).
Los datos OSM se redistribuyen bajo ODbL 1.0; contorno Natural Earth de dominio
público; fotografía CC BY 2.0 e iconos ISC/MIT.
Consultar [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md) y los créditos de cada recurso.



