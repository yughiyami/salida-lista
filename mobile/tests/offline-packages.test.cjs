const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { OFFLINE_MAP_PACKAGES, isInsidePackage } = require('../src/domain/offlineMaps.ts');
const dir = path.join(__dirname, '../assets/maps');
test('seven static offline packages favor Arequipa without pretending detailed national coverage', () => {
 assert.equal(OFFLINE_MAP_PACKAGES.length, 7);
 assert.equal(OFFLINE_MAP_PACKAGES[0].id, 'arequipa-metropolitana');
 assert.equal(new Set(OFFLINE_MAP_PACKAGES.map(x => x.id)).size, 7);
 for(const pack of OFFLINE_MAP_PACKAGES) {
  assert.equal(pack.data.type, 'FeatureCollection');
  assert.ok(pack.data.features.length > (pack.id === "arequipa-metropolitana" ? 10 : 100));
  assert.ok(isInsidePackage(pack, { longitude: pack.center[0], latitude: pack.center[1] }));
  assert.equal(isInsidePackage(pack, { longitude: -77.04, latitude: -12.04 }), pack.id==='peru-referencia');
  assert.equal(isInsidePackage(pack, { longitude: NaN, latitude: pack.center[1] }), false);
  for(const feature of pack.data.features) {
   if (feature.properties.osm_id) assert.match(feature.properties.osm_id, /^(node|way)\/\d+$/);
   else assert.ok(feature.properties.derived_osm_count > 0 || feature.properties.reference_boundary === true);
   const points=[];
   const visit=(value)=> {if(typeof value[0]==='number') points.push(value);else value.forEach(visit);};
   visit(feature.geometry.coordinates);
   assert.ok(points.length);
   points.forEach(([lon,lat]) => { assert.ok(Number.isFinite(lon)&&lon>=-180&&lon<=180);assert.ok(Number.isFinite(lat)&&lat>=-90&&lat<=90); });
  }
 }
});
test('each Arequipa derivative retains verifiable ODbL source provenance', () => {
 for(const pack of OFFLINE_MAP_PACKAGES.filter(x=>['arequipa-centro','arequipa-yanahuara','colca-chivay','colca-condor'].includes(x.id))) {
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

 test('PBF-derived national and metropolitan layers fit explicit budgets with a provenance ledger', () => {
  for(const id of ['peru-referencia','arequipa-metropolitana']) {
   const raw=fs.readFileSync(path.join(dir,id+'.geojson.json'));
   const manifest=JSON.parse(fs.readFileSync(path.join(dir,id+'.manifest.json')));
   assert.equal(manifest.source,'https://download.geofabrik.de/south-america/peru-latest.osm.pbf');
   assert.equal(manifest.license,'ODbL-1.0');
   assert.equal(manifest.sourceSha256.length,64);
   assert.ok(manifest.sourceBytes > 200_000_000);
   assert.equal(raw.length,manifest.derivedBytes);
   assert.ok(raw.length <= (id==='peru-referencia'?4_000_000:6_000_000));
   assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),manifest.derivedSha256);
   assert.equal(JSON.parse(raw).features.length,manifest.featureCount);
   assert.ok(manifest.osmReplicationTimestamp);
   assert.deepEqual(manifest.bounds,OFFLINE_MAP_PACKAGES.find(x=>x.id===id).bounds);
   if(id==='peru-referencia') {
    assert.equal(manifest.boundarySource.referenceOnly,true);
    assert.equal(manifest.boundarySource.notLegalBoundary,true);
    assert.equal(manifest.boundarySource.license,'Public domain');
    assert.ok(Object.values(manifest.aggregatedWayCounts).reduce((a,b)=>a+b,0)>1000);
   }
  }
 });
 test('metropolitan ways are clipped to the declared rectangle, not implied department coverage', () => {
  const pack=OFFLINE_MAP_PACKAGES.find(x=>x.id==='arequipa-metropolitana');
  let roads=0;
  const visit=(value)=> {if(typeof value[0]==='number') assert.ok(isInsidePackage(pack,{longitude:value[0],latitude:value[1]}));else value.forEach(visit);};
  for(const f of pack.data.features) {visit(f.geometry.coordinates); if(f.properties.highway) roads += f.properties.derived_osm_count ?? 1;}
  assert.ok(roads>1000);
 });


