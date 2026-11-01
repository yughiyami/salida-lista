import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  Check,
  ChevronRight,
  ClipboardList,
  Crosshair,
  Ellipsis,
  ExternalLink,
  LocateOff,
  LocateFixed,
  Map,
  Plus,
  Route,
  Save,
  Share2,
  Users,
} from "lucide-react-native";

const icons = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  backpack: Backpack,
  check: Check,
  chevronRight: ChevronRight,
  clipboard: ClipboardList,
  crosshair: Crosshair,
  ellipsis: Ellipsis,
  externalLink: ExternalLink,
  gpsOff: LocateOff,
  locate: LocateFixed,
  map: Map,
  plus: Plus,
  route: Route,
  save: Save,
  share: Share2,
  users: Users,
};
export type AppIconName = keyof typeof icons;

/** Bundled SVG paths: no glyph font, remote resource or network request. */
export function AppIcon({
  name,
  size = 24,
  color = "#163F35",
}: {
  name: AppIconName;
  size?: number;
  color?: string;
}) {
  const Icon = icons[name];
  return <Icon size={size} color={color} strokeWidth={2} accessible={false} />;
}
