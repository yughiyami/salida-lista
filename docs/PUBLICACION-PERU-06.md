# Publicación y ampliación nacional — 16 de octubre de 2026

## Repositorio

https://github.com/yughiyami/salida-lista

Repositorio Git público confirmado mediante GitHub API (isPrivate=false). Rama master; primer incremento publicado dc30332aa1ed71b599ab89bb5f7e241e69a89824. Se conservó el historial inicial del template Expo; no se reescribió el checkout.

## Protección de datos antes de publicar

Auditoría read-only de código/configs/historial: sin patrones de secretos detectados. Se publicaron únicamente el proyecto mobile y los assets/avisos de terceros. No se publicaron evidencias de teléfonos, coordenadas privadas, seriales, bases SQLite, claves de firma, tokens, archivos env reales, caches, tool runtimes ni carpetas nativas generadas.

.claude/settings.json (solo preferencia del plugin Expo, sin secretos) se retiró del índice del incremento sin borrar el archivo local. .codegraph, .claude, .cache, .venv-maps y auditorías locales quedaron excluidos.

Se conservó la licencia MIT del template Expo y se añadieron avisos de foto CC BY 2.0, Lucide ISC/Feather MIT y datos OSM ODbL. README informa las 28 alertas del último audit local y que falta evaluación de compatibilidad antes de producción. No se aplicó npm audit fix --force.

## Alcance cartográfico acordado para el incremento

Fuente nacional: extracto PBF Perú de Geofabrik (~244 MiB). Descarga local de trabajo excluida de Git. Procesamiento streaming con PyOsmium/Shapely en un venv de preparación, sin dependencias Python en el teléfono.

Objetivo: capa nacional GENERALIZADA y Arequipa metropolitana ampliada, conservando los cinco extractos turísticos. No afirmar calles/senderos completos de todo Perú ni fronteras legales certificadas. El detalle nacional futuro necesita paquetes regionales vectoriales descargables y comprobaciones específicas nativas.

## Prioridades del producto

1. Cartografía offline nacional por escalas y Arequipa útil en campo, con procedencia/tamaño/cobertura.
2. GPS real offline, precisión/antigüedad y operación fuera de ruta sin bloquear eventos.
3. Salidas y grupos reales independientes con datos privados protegidos; el demo actual aún usa grupo fijo.
4. Sincronización idempotente e importación autorizada desde Bókun mediante backend, sin repetir reservas comerciales.
5. WhatsApp: compartir manual actualmente; API/confirmación de entrega con backend y conectividad después.

No se priorizan chat de reservas, IA, tracking familiar continuo, mesh ni satélite en el MVP. La app no proporciona red, rescate ni monitoreo remoto por sí sola.

Resultados de la nueva cartografía, pruebas, APK y publicación del segundo incremento se agregan únicamente cuando concluyan.

## Capas nacionales y Arequipa generadas y publicadas

Segundo incremento público: 6701b01676881a15f8e91a68234a7b7c8aeb77a3, versión de código 1.0.3 / code 4. Rama master sincronizada.

- Perú referencia: 1 668 426 bytes, 552 objetos (548 puntos, un contorno y tres clases MultiLineString), 26 668 segmentos/vías OSM principales agrupados. Simplificación angular 0.003 grados. No todas las calles ni senderos.
- Arequipa metropolitana: 3 475 228 bytes, 91 objetos (68 puntos y 23 clases MultiLineString), 41 597 objetos OSM agrupados (40 943 viales y 654 agua). Rectángulo [-71.68,-16.52,-71.38,-16.25], no todo el departamento.
- PBF único: 256 582 452 bytes, SHA256 d9375cd7a5ff27ddd60a9311cb14e405df1d0d247b0bd3b4d6d68a8bb1ee787a, timestamp OSM 2026-10-16T20:21:21Z. Fuente mundial Natural Earth v5.1.2 y PBF permanecen solo en cache excluida de Git. Contorno referencial, no frontera legal certificada.
- Presupuestos de 4/6MB se respetan. Primera conversión metropolitana 9.32MB rechazada; agrupar por clases reduce propiedades repetidas sin eliminar líneas seleccionadas (sí existe simplificación geométrica documentada). Filtros nativos PyOsmium evitan callbacks Python para millones de objetos innecesarios.
- Catálogo siete paquetes; Arequipa metropolitana inicial. Zoom nacional inicial reducido a 3.1 para el viewport móvil compacto. Grosores por zoom y prioridades de etiquetas nacionales.
- TypeScript, lint y 13 pruebas pasan. Sin cambios de esquema/DB ni dependencias móviles.

## Incidencias de compilación preservadas

Primer intento nativo falló porque CXX buscó ShadowNodes.h de RN SVG antes de completarse codegen. El header se generó durante esa misma ejecución. Se ejecutó el task oficial generateCodegenArtifactsFromSchema antes del siguiente assemble; PASS en 7s. No se editó código nativo generado.

Segundo intento adelantado falló solo en Metro porque Arequipa metropolitana aún no había terminado de generarse. No se entregó esa salida. Logs iniciales/retry preservados; compilación final se inició con ambos datasets reales presentes. Resultado final, firma y pruebas físicas se añaden cuando existan.

## APK y pre-release pública 1.0.3

Compilación final PASS (7 min 29 s). APK de 93 741 219 bytes, SHA256 09c3310d47f3a108f51e70a985d4239d0170bd33510c8e5b3afe956ed4445a93.

Verificación estática PASS con versión esperada 1.0.3 / code 4, firma interna de pruebas, bundle y ABIs arm64-v8a/x86_64. Evidencia: D:\proyectos\react_test\docs\evidence\android-peru-1.0.3\run-20261017T004350175Z-b4fb2920\evidence.json. La fecha UTC del log ya es 17; fecha local de esta sesión en Perú: 16 de octubre.

Instalación USB en Samsung sobre 1.0.2: Success. No se desinstaló ni borró almacenamiento. Tras instalar: modo avión activo, Wi-Fi disabled, Active default network none. Pantalla Dozing: revisión visual de mapas nuevos y comparación de datos después de actualizar permanecen pendientes hasta desbloqueo del usuario. No afirmar esas pruebas aprobadas solo porque el APK instaló.

Repositorio público: https://github.com/yughiyami/salida-lista
Pre-release de pruebas: https://github.com/yughiyami/salida-lista/releases/tag/v1.0.3
Se publicaron APK, SHA256, avisos de terceros y fuentes derivadas/scripts de mapas. No PBF crudo de 244.7 MiB, ni venv/cache ni datos privados de teléfonos. README público actualizado en commit a6dd405 para diferenciar compilación/instalación de prueba física pendiente. No es lanzamiento de producción.

## Prueba física 1.0.3 y corrección de encuadre

El usuario desbloqueó el Samsung y se verificó 1.0.3/code4, modo avión activado, Wi-Fi disabled y ausencia de red predeterminada. Se capturaron Arequipa metropolitana y Perú referencial dibujados sin red. Los cuatro eventos conservaron IDs/descripciones y los ocho estados de asistencia siguieron iguales (3 presentes). Evidencia privada: docs/evidence/android-peru-1.0.3/physical-upgrade-result.json, instantáneas y dos capturas. No se activó GPS ni se compartió posición.

Se observó un defecto de encuadre: Perú se recorta al norte y al sur en la vista inicial. Diagnóstico confirmado leyendo sourcesContent del source map generado: la APK incluyó zoom4. El archivo de fuente ya tenía zoom3.1, pero fue guardado 29 segundos DESPUÉS del bundle: edición concurrente con Metro. No era ausencia de datos del mapa.

Se documentó la incidencia en la pre-release1.0.3 sin reemplazar su APK. Se prepara versión1.0.4/code5 desde commit58285fa51054a49a5692cacda2fa90abdfb74b69. Cambios de producto: únicamente encuadre ya corregido en código y versión nueva, sin DB/schema. TypeScript, lint y13pruebas PASS. Codegen secuenciado antes de ensamblar PASS1m20s.

La compilación1.0.4 requiere árbolGit limpio e idéntico commit antes/después, y compara el catálogo incrustado en sourcesContent con el archivo congelado (incluyendo zoom3.1) antes de permitir distribución. No editar fuentes durante la compilación. Resultado y prueba visual nueva pendientes hasta terminar.

## Corrección final 1.0.4: comprobada físicamente

Build PASS13m51s. Guard de fuente PASS: árbol limpio/mismo commit antes y después; catálogo incrustado coincide exactamente con archivo congelado y zoom3.1. Verificación estática PASS1.0.4/code5. APK93 741 227 bytes, SHA256 ff21329c827268c4bc7fb8425f9973aa49e5346a8c0902e462deb21b24e3d166.

Instalación sobre1.0.3 Success, sin borrar datos. Se despertó únicamente la pantalla y se abrió la app, sin cambiar redes ni ubicación; no se introdujo ni se eludió una credencial de bloqueo. La jerarquía propia de SalidaLista estuvo disponible.

Prueba física en Samsung: Arequipa metropolitana renderiza, Perú referencial se ve completo norte/sur en viewport inicial. Se forzó detención del paquete, se comprobó proceso ausente y se reabrió. Cuatro IDs, textos y horas visibles de eventos idénticos; ocho estados de asistencia idénticos (3 presentes). Modo avión activo, Wi-Fi disabled, sin red predeterminada antes/después. No se activó GPS ni se inyectaron coordenadas.

Evidencia privada: D:\proyectos\react_test\docs\evidence\android-peru-1.0.4\physical-result-1.0.4.json, instantáneas de eventos/asistencia y capturas01-arequipa-offline.png y02-peru-encuadre-offline.png. Se dejó app abierta en Arequipa metropolitana. GPS real offline/centrado fuera de cobertura e iOS siguen pendientes.

La pre-release1.0.3 se conserva con incidencia conocida documentada. La corrección se distribuye como1.0.4 nueva, no se reemplazan binarios publicados. README público distingue validación real y pendientes; ningún dato privado del teléfono ni captura se sube a GitHub.
