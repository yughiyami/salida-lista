# Salida Lista 1.0.2 — Arequipa, campo libre y prueba física

## Lo implementado

La pantalla de campo ofrece cinco extractos OSM embebidos en la APK, sin descarga inicial:

| Paquete | Cobertura aproximada declarada (O, S, E, N) |
|---|---|
| Arequipa centro histórico | -71.545, -16.405, -71.530, -16.390 |
| Yanahuara | -71.548, -16.392, -71.535, -16.380 |
| Colca: Chivay / Yanque | -71.68, -15.68, -71.58, -15.60 |
| Colca: Cruz del Cóndor | -71.96, -15.64, -71.88, -15.57 |
| Salkantay | -72.65, -13.45, -72.52, -13.30 |

Son zonas parciales: no todo Arequipa, todo Colca ni los corredores entre ellas. No incluyen relieve ni navegación certificada. La selección de mapa es temporal: una pantalla nueva inicia Arequipa centro; una instancia conservada en navegación puede mantener su selección. No es una preferencia persistida.

## Operar fuera de ruta

- El mapa ya no limita el desplazamiento de la cámara a una caja geográfica.
- Una posición GPS reciente se puede centrar aunque quede fuera del paquete.
- Fuera del extracto puede verse el marcador sobre fondo sin calles: no hay cartografía descargada de ese lugar.
- Registrar eventos y asistencia no exige ruta, GPS ni conexión.
- Se puede escribir el lugar real en la descripción, sin adjudicar una ruta automáticamente.
- Cambiar mapa NO cambia la salida ni el grupo demo Salkantay. No se implementó aún crear salidas reales independientes, asignar agencias, sincronizar Bókun ni confirmar recepción por WhatsApp.
- El seguimiento GPS es solo en primer plano y se reactiva explícitamente al volver. No promete seguimiento continuo ni rescate.

## Prueba física realizada — Samsung SM-A715F, Android API 33

La prueba se hizo inicialmente con APK **1.0.1** antes de actualizar a 1.0.2. No confundir esa evidencia con ejecución de la versión nueva.

Condiciones comprobadas por ADB durante guardado y reapertura:
- Modo avión activado.
- `cmd wifi status`: **Wifi is disabled**. En este Samsung `settings wifi_on` devuelve 3; no se interpreta ese número aislado como conexión activa.
- `dumpsys connectivity`: **Active default network: none**.
- Conexión USB usada solo para instalar/automatizar; no se configuró túnel de red.

Eventos ficticios creados sin adjuntar ubicación:

| Descripción | ID real |
|---|---|
| PRUEBA-AVION-01-Arequipa | 91fca619-2c97-4303-abe3-b50e4c398293 |
| PRUEBA-AVION-02-Arequipa-Demora | 99dc8fce-2c17-4f31-ab17-882b932efccf |
| PRUEBA-AVION-03-Fuera-de-ruta | 7e1960af-2176-4063-894d-1654c91bf0b5 |

Se marcaron Valeria Torres, Mateo Rojas y Lucía Flores (personas ficticias del seed). Los otros cinco permanecieron sin marcar.

Se ejecutó `am force-stop com.salidalista.mobile`, se comprobó ausencia de PID y se abrió la actividad de nuevo. **No se desinstaló, no se borró almacenamiento y no se cambiaron ajustes de red o GPS mediante el agente.**

Resultado: **PASS**. Se compararon los tres IDs y descripciones, y los ocho estados de asistencia; permanecieron iguales (3 presentes, 5 sin marcar).

Mapa Salkantay: **PASS visual en 1.0.1 sin red tras reapertura**. Captura propia sin posición privada: `D:\proyectos\react_test\docs\evidence\android-device-apk-2026-10-16\samsung-salkantay-offline-1.0.1.png`.

Evidencias antes/después y comparación: `D:\proyectos\react_test\docs\evidence\android-device-apk-2026-10-16\samsung-*-before.json`, `samsung-*-after.json` y `samsung-persistence-result.json`.

El evento que quedó en el primer teléfono no se transfirió al Samsung. No existe sincronización entre dispositivos.

## Validación de la mejora 1.0.2

- TypeScript: PASS.
- Lint: PASS.
- 11 pruebas automatizadas: PASS (incluyen geometrías/procedencia, límites y ausencia de bloqueo de cámara, más persistencia/atomicidad SQLite).
- Compilación, instalación y verificación física de 1.0.2: pendientes al redactar esta sección; se agregan resultados reales debajo cuando terminen.

## Datos y licencia

© OpenStreetMap contributors, ODbL 1.0. Procedencia, originales, hashes y scripts de conversión en `D:\proyectos\react_test\mobile\assets\maps\README.md`.
Fuentes redistribuibles: `D:\proyectos\react_test\artifacts\android\SalidaLista-1.0.2-fuentes-mapas.zip`.
No se usan tiles del servidor público OSM ni llamadas remotas para dibujar el mapa en ejecución.

## Límites de la comprobación

No se ha verificado GPS offline en el Samsung ni centrado fuera de paquete con un fix real en ese equipo. No se inyectan ubicaciones para afirmar GPS real. Los tres eventos no tienen coordenadas. Persistencia local no equivale a envío/recepción en operaciones, comunicación satelital ni sincronización. Se usa una APK de pruebas firmada con certificado interno de debug; no es un producto de seguridad listo para producción.

## Compilación e instalación de 1.0.2

- BUILD SUCCESSFUL, 17 min 25 s. APK: D:\proyectos\react_test\artifacts\android\SalidaLista-1.0.2-Android.apk (87 110 851 bytes).
- Verificación estática PASS para paquete com.salidalista.mobile, versión 1.0.2, versionCode 3, arm64-v8a + x86_64. Firma y bundle embebido comprobados.
- Evidencia estática: D:\proyectos\react_test\docs\evidence\android-arequipa-1.0.2\run-20261016T224205545Z-6f9e0e5f\evidence.json.
- Samsung actualizado con adb install -r: Success, sin desinstalar ni borrar datos.
- Inmediatamente después de instalar: modo avión activado, Wi-Fi disabled y Active default network none.
- El teléfono apagó la pantalla durante la compilación. Comparación de datos tras actualización y revisión visual de los nuevos mapas quedan pendientes hasta que el usuario lo desbloquee. No confundir la instalación exitosa con esa comparación.
- Verificador actualizado para recibir versión esperada explícita; por defecto conserva 1.0.1/2 para no cambiar pruebas previas. Regresión: APK anterior con valores por defecto PASS y con versión esperada incorrecta FAIL, como corresponde.

## Actualización física confirmada — 16 de octubre de 2026

El usuario desbloqueó el Samsung. Se verificó versión 1.0.2 / code 3, modo avión activo, Wi-Fi disabled y ausencia de red predeterminada.

**Conservación tras actualizar: PASS.** Los tres eventos de 1.0.1 retienen exactamente sus IDs y descripciones; los ocho estados de asistencia son idénticos (tres presentes). Comparación estructurada en `D:\proyectos\react_test\docs\evidence\android-arequipa-1.0.2\upgrade-result.json`.

**Cinco mapas offline en 1.0.2: PASS visual.** Se seleccionaron y se vieron dibujar Arequipa centro, Yanahuara, Chivay/Yanque, Cruz del Cóndor y Salkantay, sin red activa. No se activó GPS ni se simularon coordenadas. Capturas reales del Samsung en `D:\proyectos\react_test\docs\evidence\android-arequipa-1.0.2\01-arequipa-centro-offline.png` hasta `05-salkantay-offline.png`.

El botón Registrar evento permaneció visible fuera del área desplazable en esas capturas. Los cinco mapas son extractos OSM parciales y no acreditan navegación, cobertura regional completa ni exactitud de caminos en campo.

## Repetición de persistencia en 1.0.2: PASS

Se creó además **PRUEBA-AVION-04-Campo-libre-sin-GPS**, ID real `78cca638-0e87-4f22-b47c-bcb997b87c2b`, sin adjuntar posición y sin solicitar GPS. Esto acredita registro sin ubicación ni validación geográfica; no acredita el centrado de un fix real fuera del paquete ni una salida real independiente del grupo demo.

Tras guardar se registraron cuatro IDs, sus descripciones y horas visibles. Se ejecutó de nuevo `am force-stop`, se comprobó ausencia del proceso y se abrió **1.0.2**. Los **cuatro IDs, descripciones y horas visibles permanecieron iguales**, y los **ocho estados de asistencia** siguieron idénticos (3 presentes y 5 sin marcar).

Antes y después: modo avión 1, Wi-Fi disabled, Active default network none. No se desinstaló, no se borró almacenamiento y no se cambiaron conexiones/GPS por el agente.

Evidencia final: `D:\proyectos\react_test\docs\evidence\android-arequipa-1.0.2\physical-result-1.0.2.json`, con instantáneas `samsung-events-before-stop.json`, `samsung-events-after-stop.json` y `samsung-attendance-after-stop.json`.

La app se dejó abierta en Arequipa centro y Partes (4). Captura real: `D:\proyectos\react_test\docs\evidence\android-arequipa-1.0.2\06-arequipa-final-cuatro-eventos.png`.

Permanece pendiente **GPS offline real del Samsung y centrar una posición reciente fuera de la cobertura**. No se simuló ni se solicitó esa posición durante estas pruebas.
