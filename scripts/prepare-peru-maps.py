"""Build bounded offline reference layers from a local Geofabrik PBF, never tiles/API calls.
Run: .venv-maps/Scripts/python scripts/prepare-peru-maps.py
Requires osmium==4.3.1 shapely==2.1.2, Python 3.13.
Download inputs once into .cache/maps (excluded from Git); provenance is embedded in manifests.
"""
import hashlib
import json
from pathlib import Path
from collections import Counter
import osmium
from shapely.geometry import LineString, shape, mapping, box

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache/maps'
DEST = ROOT / 'assets/maps'
PBF = CACHE / 'peru-latest.osm.pbf'
NE = CACHE / 'ne_10m_admin_0_countries.geojson'
NATIONAL_BOUNDS = [-81.5, -18.5, -68.5, 0.1]
AREQUIPA_BOUNDS = [-71.68, -16.52, -71.38, -16.25]
AREQUIPA_RECT = box(*AREQUIPA_BOUNDS)
TRUNKS = {'motorway', 'trunk', 'primary'}
ROADS = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'pedestrian', 'service', 'track', 'path', 'footway', 'steps', 'bridleway'}

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for part in iter(lambda: f.read(1024*1024), b''): h.update(part)
    return h.hexdigest()

def rounded(value):
    if isinstance(value, (tuple, list)): return [rounded(x) for x in value]
    return round(value, 5) if isinstance(value, float) else value

def feature(geometry, properties):
    result = mapping(geometry)
    return {'type': 'Feature', 'properties': properties, 'geometry': {'type': result['type'], 'coordinates': rounded(result['coordinates'])}}

countries = json.loads(NE.read_text('utf-8'))['features']
peru = next(x for x in countries if x['properties'].get('ADM0_A3') == 'PER')
country = shape(peru['geometry'])

class Extract(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.national = []
        self.arequipa = []
        self.major = {k: [] for k in TRUNKS}
        self.major_counts = Counter()
        self.skipped_invalid = 0
        self.ways_seen = 0

    def node(self, n):
        place = n.tags.get('place')
        tourism = n.tags.get('tourism')
        if place not in {'city', 'town', 'village'} and tourism != 'viewpoint' and n.tags.get('natural') != 'peak': return
        if not n.location.valid(): return
        lon, lat = n.location.lon, n.location.lat
        props = {tag.k: tag.v for tag in n.tags if tag.k in {'name', 'place', 'natural', 'tourism', 'population', 'capital'}}
        props['osm_id'] = f'node/{n.id}'
        f = {'type': 'Feature', 'properties': props, 'geometry': {'type': 'Point', 'coordinates': [round(lon,5),round(lat,5)]}}
        if place in {'city','town'}: self.national.append(f)
        if AREQUIPA_BOUNDS[0] <= lon <= AREQUIPA_BOUNDS[2] and AREQUIPA_BOUNDS[1] <= lat <= AREQUIPA_BOUNDS[3]: self.arequipa.append(f)

    def way(self, w):
        self.ways_seen += 1
        highway = w.tags.get('highway')
        waterway = w.tags.get('waterway')
        if highway not in ROADS and not waterway: return
        try:
            coords = [(n.lon,n.lat) for n in w.nodes]
        except osmium.InvalidLocationError:
            self.skipped_invalid += 1
            return
        if len(coords) < 2: return
        if highway in TRUNKS:
            line = LineString(coords).simplify(0.003, preserve_topology=True)
            if not line.is_empty:
                self.major[highway].append(rounded(list(line.coords)))
                self.major_counts[highway] += 1
        # First a cheap bbox check, then exact clip: no ways beyond declared area.
        xs, ys = zip(*coords)
        if max(xs) < AREQUIPA_BOUNDS[0] or min(xs) > AREQUIPA_BOUNDS[2] or max(ys) < AREQUIPA_BOUNDS[1] or min(ys) > AREQUIPA_BOUNDS[3]: return
        line = LineString(coords).intersection(AREQUIPA_RECT).simplify(0.00002, preserve_topology=True)
        if line.is_empty or line.geom_type not in {'LineString','MultiLineString'}: return
        props = {tag.k:tag.v for tag in w.tags if tag.k in {'highway','waterway','name','surface','access'}}
        props['osm_id'] = f'way/{w.id}'
        self.arequipa.append(feature(line,props))

extract = Extract()
print('Reading PBF with sparse node location index...', flush=True)
extract.apply_file(str(PBF), locations=True, idx='sparse_mem_array', filters=[osmium.filter.KeyFilter('place', 'highway', 'waterway', 'natural', 'tourism')])
for highway, lines in sorted(extract.major.items()):
    if lines:
        extract.national.append({'type':'Feature','properties':{'highway':highway,'derived_osm_count':extract.major_counts[highway],'source':'Geofabrik Peru OSM'},'geometry':{'type':'MultiLineString','coordinates':lines}})
extract.national.insert(0, feature(country.simplify(0.003, preserve_topology=True), {'name':'Perú','reference_boundary':True,'source':'Natural Earth v5.1.2','license':'Public domain'}))
# Aggregate metropolitan ways by class: retain every clipped line but avoid
# repeating per-way object/tag overhead. This layer never provided street labels.
metro_points = [f for f in extract.arequipa if f['geometry']['type'] == 'Point']
metro_groups = {}
metro_ids = []
for f in extract.arequipa:
    if f['geometry']['type'] == 'Point': continue
    props = f['properties']
    key = ('highway', props['highway']) if props.get('highway') else ('waterway', props['waterway'])
    group = metro_groups.setdefault(key, {'lines': [], 'count': 0})
    coords = f['geometry']['coordinates']
    group['lines'].extend([coords] if f['geometry']['type'] == 'LineString' else coords)
    group['count'] += 1
    metro_ids.append(props['osm_id'])
metro_counts = {}
for (tag, value), group in sorted(metro_groups.items()):
    metro_points.append({'type':'Feature','properties':{tag:value,'derived_osm_count':group['count'],'source':'Geofabrik Peru OSM'},'geometry':{'type':'MultiLineString','coordinates':group['lines']}})
    metro_counts[tag + '/' + value] = group['count']
extract.arequipa = metro_points
metro_ids_hash = hashlib.sha256('\n'.join(sorted(metro_ids)).encode()).hexdigest()
reader = osmium.io.Reader(str(PBF))
header = reader.header()
replication_time = header.get('osmosis_replication_timestamp')
reader.close()
source_hash = digest(PBF)

for id, features, bounds, tolerance, budget in [
    ('peru-referencia',extract.national,NATIONAL_BOUNDS,0.003,4_000_000),
    ('arequipa-metropolitana',extract.arequipa,AREQUIPA_BOUNDS,0.00002,6_000_000),
]:
    output = DEST / f'{id}.geojson.json'
    content = json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')).encode('utf-8')
    (CACHE/f'{id}.unbounded.geojson.json').write_bytes(content)
    if len(content)>budget: raise ValueError(f'{id}: {len(content)} bytes exceeds budget {budget}; do not bundle unbounded data')
    output.write_bytes(content)
    manifest = {'id':id,'source':'https://download.geofabrik.de/south-america/peru-latest.osm.pbf','downloadedOn':'2026-10-16','osmReplicationTimestamp':replication_time,'sourceBytes':PBF.stat().st_size,'sourceSha256':source_hash,'license':'ODbL-1.0','attribution':'© OpenStreetMap contributors; extract Geofabrik','bounds':bounds,'featureCount':len(features),'geometryTypes':dict(Counter(f['geometry']['type'] for f in features)),'derivedBytes':len(content),'derivedSha256':hashlib.sha256(content).hexdigest(),'budgetBytes':budget,'simplificationDegrees':tolerance,'roundingDecimals':5,'sourceWaysSeen':extract.ways_seen,'skippedWaysMissingNodeLocation':extract.skipped_invalid,'highwayFilter': sorted(TRUNKS if id=='peru-referencia' else ROADS),'waterwaysIncluded':id=='arequipa-metropolitana','buildDependencies':{'osmium':'4.3.1','shapely':'2.1.2'},'limitations':'Generalized reference, not all roads, no routing, no terrain, no safety certification; Arequipa is a rectangle, not department boundary.'}
    if id=='arequipa-metropolitana':
        manifest['aggregatedWayCounts']=metro_counts
        manifest['aggregatedSourceIdsSha256']=metro_ids_hash
        manifest['aggregation']='Group clipped lines by highway/waterway class; retain all selected geometries, omit per-way names and access tags from this non-routing display.'
    if id=='peru-referencia':
        manifest['aggregatedWayCounts']=dict(extract.major_counts)
        manifest['boundarySource']={'url':'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson','sourceBytes':NE.stat().st_size,'sourceSha256':digest(NE),'license':'Public domain','filter':'ADM0_A3=PER','referenceOnly':True,'notLegalBoundary':True}
    (DEST/f'{id}.manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(id,len(features),len(content),'bytes',flush=True)

