const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { OFFLINE_MAP_PACKAGES, isInsidePackage } = require('../src/domain/offlineMaps.ts');
const dir = path.join(__dirname, '../assets/maps');
test('five static offline packages favor Arequipa without pretending department coverage', () => {
 assert.equal(OFFLINE_MAP_PACKAGES.length, 5);
 assert.equal(OFFLINE_MAP_PACKAGES[0].id, 'arequipa-centro');
 assert.equal(new Set(OFFLINE_MAP_PACKAGES.map(x => x.id)).size, 5);
 for(const pack of OFFLINE_MAP_PACKAGES) {
  assert.equal(pack.data.type, 'FeatureCollection');
  assert.ok(pack.data.features.length > 100);
  assert.ok(isInsidePackage(pack, { longitude: pack.center[0], latitude: pack.center[1] }));
  assert.equal(isInsidePackage(pack, { longitude: -77.04, latitude: -12.04 }), false);
  assert.equal(isInsidePackage(pack, { longitude: NaN, latitude: pack.center[1] }), false);
  for(const feature of pack.data.features) {
   assert.match(feature.properties.osm_id, /^(node|way)\/\d+$/);
   const points=feature.geometry.type==='Point'?[feature.geometry.coordinates]:feature.geometry.type==='Polygon'?feature.geometry.coordinates.flat():feature.geometry.coordinates;
   assert.ok(points.length);
   points.forEach(([lon,lat]) => { assert.ok(Number.isFinite(lon)&&lon>=-180&&lon<=180);assert.ok(Number.isFinite(lat)&&lat>=-90&&lat<=90); });
  }
 }
});
test('each Arequipa derivative retains verifiable ODbL source provenance', () => {
 for(const pack of OFFLINE_MAP_PACKAGES.filter(x=>x.id!=='salkantay')) {
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,`${pack.id}.manifest.json`)));
  assert.equal(manifest.featureCount,pack.data.features.length);
  assert.deepEqual(manifest.bounds,pack.bounds);
  assert.equal(manifest.license,'ODbL-1.0');
  assert.equal(manifest.source,`https://api.openstreetmap.org/api/0.6/map.json?bbox=${pack.bounds.join(',')}`);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,`${pack.id}.osm-api.json`))).digest('hex'),manifest.sourceSha256);
 }
});
test('free operation never constrains camera to a package or prevents centering outside it', () => {
 const source=fs.readFileSync(path.join(__dirname,'../src/ui/OfflineGuideMap.tsx'),'utf8');
 assert.doesNotMatch(source,/maxBounds=/);
 const handler=source.slice(source.indexOf('const centerOnFix'),source.indexOf('\n  return (',source.indexOf('const centerOnFix')));
 assert.doesNotMatch(handler,/if\s*\(outside\)/);
 assert.match(handler,/center: \[fix.longitude, fix.latitude\]/);
 assert.doesNotMatch(source,/https?:\/\/[^"\s]*\/(tiles|glyphs|sprite)/);
});
