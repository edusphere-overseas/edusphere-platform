"use client";

import {
  Award,
  BedDouble,
  BriefcaseBusiness,
  FileCheck2,
  GraduationCap,
  Landmark,
  MessagesSquare,
  Plane,
  Globe2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

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

type Service = { title: string; description: string; icon?: string | null };

function ServiceCard({ icon, title, description }: Service) {
  const Icon = icons[icon ?? ""] ?? Globe2;
  return (
    <div
      className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 hover:border-white/20"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(260px circle at var(--x, 50%) var(--y, 50%), rgba(92,192,207,0.14), transparent 70%)",
        }}
      />
      <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal/30 to-navy/40 text-teal-light ring-1 ring-white/10 transition-transform duration-300 group-hover:-translate-y-0.5">
        <Icon className="h-5.5 w-5.5" aria-hidden="true" />
      </span>
      <h3 className="relative mt-5 text-lg font-bold text-white">{title}</h3>
      <p className="relative mt-2 text-[0.93rem] leading-relaxed text-white/65">{description}</p>
    </div>
  );
}

export function Services({ items }: { items: Service[] }) {
  if (items.length === 0) return null;
  return (
    <section id="services" className="relative scroll-mt-20 bg-deeper py-24 sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Student services"
          title="Support that goes the whole way"
          intro="Admission is only one part of the journey. We stay with you through visas, scholarships, housing and the day you land."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s, i) => (
            <Reveal key={s.title} delay={(i % 4) * 0.07} className="h-full">
              <ServiceCard {...s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
