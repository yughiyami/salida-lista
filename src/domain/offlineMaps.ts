import type { FeatureCollection } from "geojson";

export type OfflineMapPackage = {
  id: string;
  name: string;
  bounds: [number, number, number, number];
  center: [number, number];
  zoom: number;
  detail: string;
  data: FeatureCollection;
};

// Static requires: Metro embeds each snapshot in the APK, with no runtime download.
const metadata = require("../../assets/maps/arequipa-packages.json") as Omit<OfflineMapPackage, "data">[];
const datasets: Record<string, FeatureCollection> = {
  "arequipa-centro": require("../../assets/maps/arequipa-centro.geojson.json"),
  "arequipa-yanahuara": require("../../assets/maps/arequipa-yanahuara.geojson.json"),
  "colca-chivay": require("../../assets/maps/colca-chivay.geojson.json"),
  "colca-condor": require("../../assets/maps/colca-condor.geojson.json"),
};
export const OFFLINE_MAP_PACKAGES: OfflineMapPackage[] = [
  ...metadata.map((pack) => ({ ...pack, data: datasets[pack.id] })),
  {
    id: "salkantay",
    name: "Cusco · Salkantay",
    bounds: [-72.65, -13.45, -72.52, -13.3],
    center: [-72.574, -13.386],
    zoom: 12,
    detail: "Soraypampa, Salkantay y Wayramachay. No incluye Collpapampa.",
    data: require("../../assets/maps/salkantay.geojson.json"),
  },
];

export function isInsidePackage(
  pack: OfflineMapPackage,
  position: { longitude: number; latitude: number },
): boolean {
  const [west, south, east, north] = pack.bounds;
  return Number.isFinite(position.longitude) && Number.isFinite(position.latitude) &&
    position.longitude >= west && position.longitude <= east &&
    position.latitude >= south && position.latitude <= north;
}
