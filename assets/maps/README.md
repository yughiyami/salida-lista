# Salkantay: cartografía piloto offline

Datos © OpenStreetMap contributors, bajo [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
Información y atribución: https://www.openstreetmap.org/copyright

Fuente descargada una vez durante el desarrollo:
https://api.openstreetmap.org/api/0.6/map.json?bbox=-72.65,-13.45,-72.52,-13.30

Consulta realizada el 16 de octubre de 2026. `manifest.json` conserva fecha, bbox, conteo y SHA256 del original.
`salkantay.osm-api.json` es la respuesta original redistribuida con esta licencia;
`salkantay.geojson.json` es la base derivada, también ODbL: conversión de coordenadas
de nodos de ways a LineString/Polygon y selección de highway/waterway/natural/landuse
y nodos place/peak. No se han inventado caminos ni unido waypoints como una ruta.
Se omiten relaciones (incluidos multipolígonos complejos), edificios y otros objetos:
**es un extracto cartográfico parcial, no un mapa topográfico completo**.

Reproducir conversión local: `node scripts/prepare-offline-map.cjs` desde mobile.
Para actualizar datos, descargar respetando las políticas de OSM, conservar procedencia,
revisar límites y volver a ejecutar las pruebas. La app no consulta esa API en ejecución.
No se descargan tiles del servicio público tile.openstreetmap.org.

El área solicitada es oeste -72.65, sur -13.45, este -72.52, norte -13.30.
OSM devuelve ways completos que pueden extenderse más allá del bbox; eso no amplía
la cobertura prometida. Fuera del bbox se muestra aviso. No incluye Collpapampa.
No hay relieve, curvas de nivel, cálculo de rutas ni verificación de transitabilidad.

El archivo `.overpass` registra una consulta alternativa NO utilizada (servidores
respondieron 5xx/406); la fuente efectiva es la URL API de arriba.

## Paquetes Arequipa / Colca añadidos (16 de octubre de 2026)

Además de Salkantay se incluyen cuatro extractos OSM, con licencia ODbL-1.0:

| Paquete | Bbox O, S, E, N | Objetos derivados |
| --- | --- | --- |
| Arequipa centro histórico | -71.545, -16.405, -71.530, -16.390 | 1017 |
| Yanahuara | -71.548, -16.392, -71.535, -16.380 | 660 |
| Colca: Chivay / Yanque | -71.68, -15.68, -71.58, -15.60 | 697 |
| Colca: Cruz del Cóndor | -71.96, -15.64, -71.88, -15.57 | 216 |

Cada `<id>.manifest.json` conserva URL efectiva de descarga, bbox, fecha, conteo,
y SHA256 del original `<id>.osm-api.json`. La fuente efectiva fue una descarga
limitada por paquete de `https://api.openstreetmap.org/api/0.6/map.json?bbox=...`.
Overpass respondió 406/5xx; dos solicitudes urbanas demasiado amplias recibieron
el límite de 50 000 nodos y no generaron ningún paquete. Se redujeron las zonas
urbanas, no se inventó cartografía para rellenarlas. **No son mapas de toda la
ciudad, todo Colca, toda la región ni los corredores completos entre paquetes.**

Las bases derivadas `<id>.geojson.json` son redistribuidas bajo ODbL-1.0.
Conversión reproducible y sin conexión: `node scripts/prepare-arequipa-maps.cjs`.
Selecciona nodos place/peak/viewpoint y ways highway/waterway/natural/landuse;
se omiten edificios, otras categorías y relaciones/multipolígonos. No hay tiles,
relieve ni instrucciones giro a giro. Ways completos pueden salir del bbox;
esto no amplía la cobertura prometida. Para producción y áreas grandes usar un
extracto regional o proveedor de datos adecuado, no descarga masiva de Editing
API ni scraping de tiles públicos.

El selector cambia solo la cartografía y la cámara, **no la salida demo Salkantay**.
Selección temporal; una pantalla nueva inicia Arequipa metropolitana. Una instancia conservada por el stack puede mantener la selección. Todos los paquetes están
embebidos desde la primera apertura; cambiar de paquete no descarga nada.
La cámara permite desplazarse por el mundo y centrar un GPS reciente fuera del
paquete. Fuera de la cobertura se muestra un aviso y fondo sin mapa: no se dibujan
carreteras inexistentes. Eventos y asistencia siguen disponibles sin ruta ni GPS;
ningún geofence cartográfico bloquea el registro. Puede anotarse el lugar real
manualmente en la descripción; no se adjudica una ruta automáticamente.


## Perú referencial + Arequipa metropolitana (fuente PBF nacional)

Estos dos paquetes nuevos NO utilizan Editing API ni scraping de tiles:

- `peru-referencia`: cobertura de orientación nacional con vías motorway/trunk/primary
  y nodos city/town de un extracto OSM de Perú. Las vías se generalizan con tolerancia
  angular 0.003° (orden de cientos de metros, variable con latitud) y se agrupan por
  clase. **No incluye todas las carreteras, calles ni senderos**; no usar la línea
  generalizada para seguir un camino a pie. No incorpora relieve, tráfico ni routing.
- `arequipa-metropolitana`: selección de red vial/senderos y agua del mismo PBF,
  recortada exactamente al rectángulo O=-71.68, S=-16.52, E=-71.38, N=-16.25
  (aproximadamente 32 × 30 km). **No es toda Arequipa departamento**; no contiene
  todos los objetos OSM (edificios y relaciones omitidos). Simplificación 0.00002°,
  coordenadas redondeadas a cinco decimales. OSM puede ser incompleto o erróneo.

La fuente se descarga una vez de
https://download.geofabrik.de/south-america/peru-latest.osm.pbf
hacia `.cache/maps/peru-latest.osm.pbf`; **no se versiona ni se carga este PBF en
el APK**. Cada manifest conserva SHA256, tamaño, fecha, timestamp de replicación
OSM cuando está disponible, filtros, simplificación, conteos y SHA256 del derivado.
Las vías agrupadas conservan conteos de objetos por categoría; los objetos individuales
restantes conservan `osm_id`. La geometría no es una ruta turística adjudicada.

El contorno nacional usa únicamente `ADM0_A3=PER` del dataset Natural Earth:
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson
Versión fijada v5.1.2; SHA256 original registrado en manifest. Fuente original global
solo en `.cache/maps/ne_10m_admin_0_countries.geojson` (no Git/APK).
Natural Earth es dominio público:
https://www.naturalearthdata.com/about/terms-of-use/
Escala de fuente 1:10 millones, además simplificada para esta vista: **contorno
referencial, NO delimitación legal, catastral, oficial ni prueba de pertenencia**.
La atribución se muestra por separado de OSM; ODbL aplica a los derivados OSM.
No se interpreta como una delimitación oficial peruana.

### Reproducción en Windows

```powershell
python -m venv .venv-maps
.\.venv-maps\Scripts\python.exe -m pip install osmium==4.3.1 shapely==2.1.2
New-Item -ItemType Directory -Force .cache/maps
Invoke-WebRequest 'https://download.geofabrik.de/south-america/peru-latest.osm.pbf' -OutFile '.cache/maps/peru-latest.osm.pbf'
Invoke-WebRequest 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson' -OutFile '.cache/maps/ne_10m_admin_0_countries.geojson'
.\.venv-maps\Scripts\python.exe scripts/prepare-peru-maps.py
npm test
```

`latest` cambia: para reproducir los bytes exactos usar una copia del PBF con SHA256
igual al manifest; para actualizar, aceptar explícitamente el nuevo timestamp/hash y
volver a probar. El script procesa el PBF con índice de nodos disperso, sin base de
datos del usuario ni llamadas de red. Conserva rutas estáticas, verifica presupuesto
máximo 4 MB para referencia nacional y 6 MB para área metropolitana; falla si se excede
el presupuesto en vez de empaquetar un GeoJSON arbitrariamente grande. El PBF y venv
son herramientas de preparación, no nuevas dependencias de la app.

La orientación general de Perú no reemplaza paquetes detallados regionales. Para
cobertura de calles/senderos nacional a múltiples niveles, la siguiente arquitectura
es teselas vectoriales PMTiles regionales con catálogo, espacio, versión, checksum,
estilo/fuentes offline y pruebas nativas; no cargar un GeoJSON gigante en JS.

La red metropolitana también agrupa líneas por clase highway/waterway para reducir sobrecarga de objetos sin eliminar las geometrías seleccionadas; no conserva nombres ni etiquetas de acceso de cada way en la visualización (no es motor de routing). El manifest conserva conteos por clase y SHA256 de la lista ordenada de IDs fuente agrupados. Las fuentes y la conversión reproducible siguen disponibles. El filtro nativo de PyOsmium deja indexar ubicaciones antes de descartar objetos no pertinentes, evitando millones de callbacks Python innecesarios.


### Métricas verificadas de esta preparación

| Paquete | Bytes JSON | Objetos GeoJSON | Geometrías fuente OSM agrupadas |
| --- | ---: | ---: | ---: |
| Perú referencial | 1 668 426 | 552 (548 puntos + contorno + 3 grupos) | 26 668 vías principales |
| Arequipa metropolitana | 3 475 228 | 91 (68 puntos + 23 grupos) | 41 597 ways (40 943 viales y 654 agua) |

Ambos derivan del mismo PBF SHA256
`d9375cd7a5ff27ddd60a9311cb14e405df1d0d247b0bd3b4d6d68a8bb1ee787a`,
timestamp de replicación `2026-10-16T20:21:21Z`, 256 582 452 bytes.
No se descartaron ways seleccionados por ubicaciones de nodo faltantes.
Estas cifras verifican el contenido y presupuesto de los datos; **no prueban
rendimiento, GPS real ni dibujo de estas capas en el teléfono**.

Pruebas automatizadas: presupuesto/hash de derivados, ledger/licencias, coordenadas
finitas, clip exacto metropolitano, selector nacional/urbano y cámara sin maxBounds.
Se mantienen pruebas de persistencia SQLite; una prueba nativa física sigue siendo
necesaria antes de afirmar que la nueva APK funciona offline en un dispositivo.
