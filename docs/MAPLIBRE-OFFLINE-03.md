# MapLibre offline + GPS — incremento 03

**Estado:** implementado, instalado y probado en el emulador Android sin internet. Ubicación simulada; pendiente validar GNSS en teléfonos y en campo.

## Implementación

- MapLibre React Native **11.5.0**, integrado con plugin Expo/CNG y build nativa. No Expo Go ni WebView.
- `mobile/src/ui/OfflineGuideMap.tsx`: mapa, fuentes GeoJSON locales, capas de caminos, senderos, agua y áreas, etiquetas React Native, controles GPS y estados de error.
- El estilo no contiene URLs de tiles, sprites, glyphs, geocoder ni DEM. La geometría se incorpora al bundle JS del APK. No es una captura de pantalla ni el anterior dibujo SVG.
- 268 objetos OSM: 14 puntos, 186 líneas y 68 polígonos, aproximadamente 397 KB de GeoJSON. Cobertura piloto oeste -72.65, sur -13.45, este -72.52, norte -13.30. Incluye entorno Soraypampa/Salkantay/Wayramachay, **no Collpapampa ni todo Perú**.
- Zoom y desplazamiento nativos limitados al área; botón «Centrar en mí» con posición reciente dentro del paquete.
- GPS opcional: `expo-location` SDK58, permiso en uso, watch en primer plano. Muestra latitud/longitud, precisión reportada y hora original. No fabrica una posición cuando no hay fix.
- El watch se retira al perder foco, pasar al fondo o desmontar. Activaciones nativas tardías se cancelan lógicamente y se retiran al resolver. La última posición pasa a «no actual» al detenerlo o si tiene más de 30 segundos.
- Una posición fuera del área no inventa cartografía ni desplaza la cámara a una zona vacía. Mapa y captura puntual para eventos son acciones separadas: mirar el mapa no adjunta ubicación automáticamente a un parte.
- Registrar evento sigue fijo fuera del scroll. La base SQLite, su nombre y la migración no cambian.

## Procedencia y licencia

Datos reales obtenidos de la [API principal de OSM](https://api.openstreetmap.org/api/0.6/map.json?bbox=-72.65,-13.45,-72.52,-13.30). Overpass no respondió correctamente durante este desarrollo; no es una dependencia en ejecución.

© OpenStreetMap contributors — [ODbL / atribución](https://www.openstreetmap.org/copyright).
Original y base derivada están disponibles en `mobile/assets/maps/`, con manifiesto SHA256, alcance, conversor y licencia enlazada. La derivación no une puntos para inventar senderos. Se omiten relaciones multipolígono complejas y otros objetos: no es cartografía topográfica completa, no indica transitabilidad y no sustituye una ruta validada por el operador.

## Construcción reproducible

Desde `D:\proyectos\react_test\mobile`, con Node24, JDK21 y SDK Android configurados:

```powershell
npm ci
npx expo prebuild --platform android --no-install
.\android\gradlew.bat -p android app:assembleRelease -x lint -x test --configure-on-demand --build-cache -PreactNativeArchitectures=x86_64
```

Se conserva el plugin de CMake3.31.6 y límite de rutas para Windows. No se editaron manualmente fuentes Android generadas. APK x86_64 del emulador no sirve para la mayoría de teléfonos ARM; iOS necesita su build y pruebas propias.

## Validaciones

Lint, TypeScript y 8 pruebas de Node pasan, incluida integridad/procedencia del mapa y persistencia de SQLite. Las pruebas Node no acreditan el renderer nativo ni el receptor GPS.

### Prueba nativa realizada el 16/10/2026

Android API37, emulador `emulator-5554`, APK release x86_64 con JS embebido, sin Metro. Modo avión activado, Wi-Fi y datos desactivados; `dumpsys connectivity` informa `Active default network: none` **antes de instalar y en la comprobación final**. No se modificó el teléfono físico conectado.

| Caso | Resultado / evidencia |
|---|---|
| Primera apertura de MapLibre sin haber conectado antes la nueva app | Mapa real visible, no dependiente de caché online. [Primera apertura](evidence/android-maplibre-2026-10-16/01-first-open-map-offline.png) |
| Reapertura en frío sin red | [Cartografía local visible](evidence/android-maplibre-2026-10-16/10-final-cold-map-offline.png) |
| Denegar ubicación | Error explícito; el mapa permanece disponible. [Permiso denegado](evidence/android-maplibre-2026-10-16/04-permission-denied-final.png) |
| Autorizar ubicación en uso, sin red | Posición recibida del proveedor nativo. [Primer fix](evidence/android-maplibre-2026-10-16/05-gps-fix-a-final.png) |
| Mover ubicación y centrar | Cambian coordenadas y punto del guía; la cámara hace zoom sin red. [Movimiento](evidence/android-maplibre-2026-10-16/06-gps-fix-b-moved-offline.png) |
| Fuera del paquete | Aviso de falta de cartografía, sin fingir mapa de otra zona. [Fuera del área](evidence/android-maplibre-2026-10-16/07-outside-package-offline.png) |
| Enviar app al fondo y volver | GPS desactivado, última posición rotulada no actual; no se reactiva solo. [GPS detenido](evidence/android-maplibre-2026-10-16/08-gps-stopped-on-background.png) |
| Evento con posición sin red | `MAPOFFLINE04`, posición -13.380000/-72.569000 capturada y guardada localmente. [Formulario](evidence/android-maplibre-2026-10-16/11-event-with-gps-offline.png) |
| Forzar cierre y reabrir | PID cambia de 28467 a 28948; reaparece el nuevo evento con posición. Los tres IDs anteriores permanecen: cuatro eventos en total. [Partes reabiertos](evidence/android-maplibre-2026-10-16/13-events-reopened-offline.png), [comparación de IDs](evidence/android-maplibre-2026-10-16/event-persistence.json) |
| Participantes tras actualizar y reiniciar | Valeria y Mateo siguen marcados, 2/8 presentes. [Presencias conservadas](evidence/android-maplibre-2026-10-16/14-participants-preserved-offline.png) |
| Servicios de ubicación apagados, APK final | Aviso explícito antes de pedir permiso; mapa local disponible. [GPS apagado](evidence/android-maplibre-2026-10-16/15-location-services-off-map-available.png) |
| Movimiento GPS en APK final | Posición cambia tras volver a habilitar ubicación, sin activar la red. [Estado final](evidence/android-maplibre-2026-10-16/16-final-gps-moved-offline.png) |
| Vista final centrada | Se centra el punto recibido del proveedor nativo y permanece visible Registrar evento. [Mapa y guía](evidence/android-maplibre-2026-10-16/17-final-centered-gps-offline.png) |

**Ubicación simulada, no prueba de campo:** se inyectaron fixes mediante `adb emu geo fix`, primero longitud/latitud -72.574/-13.386 y después -72.569/-13.380; para salir del paquete -77.04/-12.04. La precisión ±5 m es la reportada por el proveedor simulado, no una medición de precisión real en Salkantay. Puede haber redondeo de pocos decimales. No se acreditan adquisición satelital real, autonomía, pruebas físicas o iOS.

Capturas 04–08 corresponden a la compilación de corrección de GPS; 10–14 a la revisión que limpia errores transitorios al recibir un fix nuevo; 15 en adelante al APK final, que comprueba servicios antes de pedir permiso. La evidencia anterior 03/03b registra el fallo detectado, no un GPS funcionando.

APK local final: `artifacts/android/salida-lista-maplibre-demo-emulator-x86_64.apk`.
SHA256: `CF36D78B6410948678B996299528311A913C10B54E9168B8FB5191935F53D2C3`.
Build inicial 11m21s, corrección 2m46s, limpieza de errores 1m01s y revisión de servicios 3m36s; logs conservados. La instalación final utilizó `adb install --no-streaming -r` tras una desconexión transitoria de ADB durante la transferencia; sin desinstalar ni borrar datos.

Durante la última repetición hubo desconexiones ADB y el diálogo `System UI isn't responding` del emulador. Se reinició y después se hizo un arranque en frío del AVD (`-no-snapshot-load`, sin `-wipe-data`). Tras arrancar, la app volvió a mostrar cuatro partes, conservando los datos. Este incidente del entorno también queda registrado: no se considera una prueba de estabilidad prolongada ni de rendimiento en teléfonos reales.

La comprobación posterior al arranque en frío pasó: servicios apagados → aviso; servicios habilitados → GPS opt-in y dos posiciones distintas recibidas sin red. El estado de conectividad final está en [network-final.txt](evidence/android-maplibre-2026-10-16/network-final.txt). La vista final se centró en una tercera posición simulada cercana (-72.5689/-13.3800).

Para repetir: abrir «En ruta», desplazar el contenido hasta «Activar GPS», autorizar si se solicita y pulsar «Centrar en mí». «Registrar evento» permanece fijo. En el emulador, enviar posiciones desde Extended Controls → Location o `adb -s emulator-5554 emu geo fix LONGITUD LATITUD`. Si no llega un fix, la app conserva el mapa sin inventar ubicación. Tras salir/volver al fondo, reactivar explícitamente. La última posición puede pasar a antigua si no se reciben actualizaciones.

### Fallo descubierto y corregido durante la prueba

Android devolvió `Location request failed due to unsatisfied device settings` aun con GPS habilitado. El código nativo de Expo58 comprueba si el proveedor de red está habilitado antes de solicitar posiciones cuando `mayShowUserSettingsDialog` usa su valor por defecto. En este emulador sin proveedor de red, esa resolución fallaba. Se configuró **`mayShowUserSettingsDialog: false`**, sin rebajar `Accuracy.High`, tanto en el watch del mapa como en la captura puntual de eventos. Así se solicita ubicación sin exigir ese diálogo de red; no se inventa posición ni se ignoran permisos.

También se separó la intención de solicitar permiso del token del watch: un cambio de AppState por el modal no oculta silenciosamente la denegación. Solo se inicia el watch con permiso y pantalla activa; nunca desde un listener de reanudación. Se comprueba también si la ubicación está habilitada ANTES de solicitar permiso, evitando el modal global de Android al estar apagada. Se recortan las etiquetas al viewport del mapa y un fix nuevo limpia errores transitorios de centrado.

## Límites pendientes

Sin gestor de descarga/actualización de regiones, relieve, navegación giro a giro, ruta aprobada por la agencia ni seguimiento en segundo plano. No hay monitoreo remoto, rescate, Bókun ni WhatsApp Business conectados. GPS offline no significa comunicación con otros teléfonos. La adquisición real GNSS requiere pruebas de campo y puede tardar o fallar por entorno/hardware; el emulador usa ubicación simulada.

Auditoría de dependencias actualizada: 28 alertas (20 altas, 8 moderadas), pendientes de evaluación y corrección compatible antes de producción; no se aplicaron downgrades forzados.

## Documentación primaria consultada

- [MapLibre Expo](https://maplibre.org/maplibre-react-native/docs/setup/expo/)
- [MapLibre Map](https://maplibre.org/maplibre-react-native/docs/components/map/)
- [GeoJSONSource](https://maplibre.org/maplibre-react-native/docs/components/sources/geo-json-source/)
- [Expo Location SDK58](https://docs.expo.dev/versions/v58.0.0/sdk/location/)
- [Android: inyección de ubicación del emulador](https://developer.android.com/studio/run/emulator-console#geo)
