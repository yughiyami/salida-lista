const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dir = path.join(__dirname, '../assets/maps');
const map = JSON.parse(fs.readFileSync(path.join(dir, 'salkantay.geojson.json')));
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json')));

test('offline map has actual OSM geometries, source provenance and local coverage', () => {
  assert.equal(map.type, 'FeatureCollection');
  assert.equal(map.features.length, manifest.featureCount);
  assert.ok(map.features.length > 100);
  assert.equal(manifest.license, 'ODbL-1.0');
  assert.deepEqual(manifest.bounds, [-72.65, -13.45, -72.52, -13.30]);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, 'salkantay.osm-api.json'))).digest('hex'), manifest.sourceSha256);
  for (const feature of map.features) {
    assert.match(feature.properties.osm_id, /^(node|way)\/\d+$/);
    assert.ok(['Point', 'LineString', 'Polygon'].includes(feature.geometry.type));
  }
  assert.ok(map.features.some(f => f.properties.name === 'Soraypampa'));
  assert.ok(map.features.some(f => f.properties.highway === 'path'));
  assert.ok(map.features.some(f => f.properties.waterway));
});
