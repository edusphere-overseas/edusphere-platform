import { Award, Briefcase, Home, Landmark, Plane } from "lucide-react";
import type { ServiceDef } from "@/lib/portal/services";

const icons = { plane: Plane, home: Home, briefcase: Briefcase, award: Award, landmark: Landmark };

export function PortalServiceIcon({ icon, className = "h-5 w-5" }: { icon: ServiceDef["icon"]; className?: string }) {
  const Icon = icons[icon];
  return <Icon className={className} aria-hidden="true" />;
}
