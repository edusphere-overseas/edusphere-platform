import {
  Award,
  BedDouble,
  BriefcaseBusiness,
  FileCheck2,
  Globe2,
  GraduationCap,
  Landmark,
  MessagesSquare,
  Plane,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  messages: MessagesSquare,
  graduation: GraduationCap,
  "file-check": FileCheck2,
  award: Award,
  bed: BedDouble,
  plane: Plane,
  briefcase: BriefcaseBusiness,
  landmark: Landmark,
  globe: Globe2,
  wallet: Wallet,
};

/** Icon chosen for a student service in the Content area. */
export function ServiceIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = icons[name ?? ""] ?? Globe2;
  return <Icon className={className} aria-hidden="true" />;
}
