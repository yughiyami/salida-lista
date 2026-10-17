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
Selección temporal; una pantalla nueva inicia Arequipa centro. Una instancia conservada por el stack puede mantener la selección. Todos los paquetes están
embebidos desde la primera apertura; cambiar de paquete no descarga nada.
La cámara permite desplazarse por el mundo y centrar un GPS reciente fuera del
paquete. Fuera de la cobertura se muestra un aviso y fondo sin mapa: no se dibujan
carreteras inexistentes. Eventos y asistencia siguen disponibles sin ruta ni GPS;
ningún geofence cartográfico bloquea el registro. Puede anotarse el lugar real
manualmente en la descripción; no se adjudica una ruta automáticamente.

