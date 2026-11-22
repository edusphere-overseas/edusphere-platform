import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NoStudent } from "@/components/portal/NoStudent";
import { ServiceForm } from "@/components/portal/ServiceForm";
import { PortalServiceIcon } from "@/components/portal/ServiceIcon";
import { Card, Notice } from "@/components/portal/ui";
import { getSiteContent } from "@/lib/content";
import { getPortal } from "@/lib/portal/context";
import { serviceByKey } from "@/lib/portal/services";

export const metadata: Metadata = { title: "Request a service" };

export default async function NewServicePage({ params }: PageProps<"/portal/services/new/[service]">) {
  const p = await getPortal();
  if (!p.student) return <NoStudent />;
  const def = serviceByKey((await params).service);
  if (!def) notFound();
  const { portalServices } = await getSiteContent();
  const setting = portalServices[def.settingsKey];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/portal/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-deep">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Services
      </Link>
      <div className="mt-4 mb-6 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal/10 text-teal">
          <PortalServiceIcon icon={def.icon} className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-deep sm:text-3xl">{def.title}</h1>
          <p className="mt-1.5 leading-relaxed text-slate">{def.weDo}</p>
          {p.role === "parent" && <p className="mt-1 text-sm font-semibold text-teal">For {p.student.name}</p>}
        </div>
      </div>
      <Card>
        {setting.show ? (
          <ServiceForm service={def.key} studentId={p.student.id} setting={setting} />
        ) : (
          <Notice tone="info">This service isn&apos;t available in the portal right now. Please message us and we&apos;ll help.</Notice>
        )}
      </Card>
    </div>
  );
}
