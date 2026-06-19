import {
  Smartphone,
  Laptop,
  Tv,
  Refrigerator,
  Shirt,
  Baby,
  Sparkles,
  HeartPulse,
  Sofa,
  UtensilsCrossed,
  Dumbbell,
  Gamepad2,
  Car,
  Wrench,
  BookOpen,
  Music,
  Luggage,
  Briefcase,
  Palette,
  Store,
  Package,
  SprayCan,
  Plug,
  Camera,
  Mic,
  Tag,
  CreditCard,
  FileText,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  // Catalog (20 catégories)
  Smartphone,
  Laptop,
  Tv,
  Refrigerator,
  Shirt,
  Baby,
  Sparkles,
  HeartPulse,
  Sofa,
  UtensilsCrossed,
  Dumbbell,
  Gamepad2,
  Car,
  Wrench,
  BookOpen,
  Music,
  Luggage,
  Briefcase,
  Palette,
  // Admin
  SprayCan,
  Plug,
  // Messaging
  Camera,
  Mic,
  Tag,
  CreditCard,
  FileText,
  // Fallbacks
  Store,
  Package,
};

export function getCategoryIcon(name: string | undefined | null): LucideIcon {
  if (!name) return Store;
  return ICON_MAP[name] ?? Store;
}

type Props = {
  name: string | undefined | null;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
};

export function CategoryIcon({ name, className, style, strokeWidth }: Props) {
  const Icon = getCategoryIcon(name);
  return <Icon className={className} style={style} strokeWidth={strokeWidth} />;
}
