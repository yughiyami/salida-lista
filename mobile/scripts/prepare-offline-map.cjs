// Offline derivative of OSM data. No requests are made by the installed app.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dir = path.join(__dirname, '../assets/maps');
const raw = fs.readFileSync(path.join(dir, 'salkantay.osm-api.json'));
const osm = JSON.parse(raw);
const nodes = new Map(osm.elements.filter(e => e.type === 'node').map(e => [e.id, e]));
const features = osm.elements.flatMap(e => {
  const properties = { ...e.tags, osm_id: `${e.type}/${e.id}` };
  if (e.type === 'node') return properties.place || properties.natural === 'peak' ? [{ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [e.lon, e.lat] } }] : [];
  if (e.type !== 'way') return [];
  if (!properties.highway && !properties.waterway && !properties.natural && !properties.landuse) return [];
  e.geometry = e.nodes.map(id => nodes.get(id));
  if (!e.geometry || e.geometry.length < 2 || e.geometry.some(p => p.lat == null || p.lon == null)) return [];
  const coordinates = e.geometry.map(p => [p.lon, p.lat]);
  const closed = e.nodes[0] === e.nodes.at(-1);
  const area = closed && !properties.highway && (properties.natural || properties.landuse) && properties.area !== 'no';
  return [{ type: 'Feature', properties, geometry: area ? { type: 'Polygon', coordinates: [coordinates] } : { type: 'LineString', coordinates } }];
});
fs.writeFileSync(path.join(dir, 'salkantay.geojson.json'), JSON.stringify({ type: 'FeatureCollection', features }));
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
  name: 'Salkantay - extracto piloto', bounds: [-72.65, -13.45, -72.52, -13.30],
  source: 'https://api.openstreetmap.org/api/0.6/map.json?bbox=-72.65,-13.45,-72.52,-13.30', timestamp: new Date().toISOString(),
  license: 'ODbL-1.0', attribution: '© OpenStreetMap contributors',
  featureCount: features.length, sourceSha256: crypto.createHash('sha256').update(raw).digest('hex'),
}, null, 2));
console.log(`Prepared ${features.length} geographic features.`);
