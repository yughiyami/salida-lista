// Rebuild derivatives from the preserved source files. Never downloads at app runtime.
// Download each bounded source once using its manifest source URL; this script is local only.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dir = path.join(__dirname, '../assets/maps');
const packs = require('../assets/maps/arequipa-packages.json');
for (const pack of packs) {
 const raw = fs.readFileSync(path.join(dir, `${pack.id}.osm-api.json`));
 const osm = JSON.parse(raw);
 const nodes = new Map(osm.elements.filter(x => x.type === 'node').map(x => [x.id, x]));
 const features = osm.elements.flatMap(o => {
  const properties = { ...o.tags, osm_id: `${o.type}/${o.id}` };
  if (o.type === 'node') return properties.place || properties.natural === 'peak' || properties.tourism === 'viewpoint' ? [{ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [o.lon, o.lat] } }] : [];
  if (o.type !== 'way' || (!properties.highway && !properties.waterway && !properties.natural && !properties.landuse)) return [];
  const geometry = o.nodes.map(id => nodes.get(id));
  if (geometry.length < 2 || geometry.some(x => !x)) return [];
  const coordinates = geometry.map(x => [x.lon, x.lat]);
  const closed = o.nodes[0] === o.nodes.at(-1);
  const area = closed && !properties.highway && !properties.waterway && (properties.natural || properties.landuse) && properties.area !== 'no';
  return [{ type: 'Feature', properties, geometry: area ? { type: 'Polygon', coordinates: [coordinates] } : { type: 'LineString', coordinates } }];
 });
 if (!features.length) throw Error(`Empty map ${pack.id}`);
 fs.writeFileSync(path.join(dir, `${pack.id}.geojson.json`), JSON.stringify({ type: 'FeatureCollection', features }));
 fs.writeFileSync(path.join(dir, `${pack.id}.manifest.json`), JSON.stringify({ ...pack, source: `https://api.openstreetmap.org/api/0.6/map.json?bbox=${pack.bounds.join(',')}`, downloadedOn: '2026-10-16', license: 'ODbL-1.0', attribution: '© OpenStreetMap contributors', featureCount: features.length, sourceSha256: crypto.createHash('sha256').update(raw).digest('hex') }, null, 2));
 console.log(pack.id, features.length);
}
