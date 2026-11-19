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
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const services: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: MessagesSquare,
    title: "Counselling and shortlisting",
    text: "An honest conversation about your goals, then a shortlist of courses and universities that genuinely suit you.",
  },
  {
    icon: GraduationCap,
    title: "University applications",
    text: "Applications, statements of purpose and references prepared carefully, and submitted on time.",
  },
  {
    icon: FileCheck2,
    title: "Visa guidance",
    text: "A clear document checklist, financial planning and interview preparation for your student visa.",
  },
  {
    icon: Award,
    title: "Scholarship assistance",
    text: "We look for scholarships and fee awards you may qualify for and help you put your best case forward.",
  },
  {
    icon: BedDouble,
    title: "Accommodation abroad",
    text: "Help finding safe, well-located student housing before you leave home.",
  },
  {
    icon: Plane,
    title: "Airport pickup and drop",
    text: "A friendly face when you land, and a smooth start to your first week.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Post-study work visa",
    text: "Guidance on staying on to work after your degree, through appropriately regulated advisers where required.",
  },
  {
    icon: Landmark,
    title: "UK onshore programmes",
    text: "Already in the UK? Onshore admission options alongside your post-study plans.",
  },
];

function ServiceCard({ icon: Icon, title, text }: (typeof services)[number]) {
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
      <p className="relative mt-2 text-[0.93rem] leading-relaxed text-white/65">{text}</p>
    </div>
  );
}

export function Services() {
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
          {services.map((s, i) => (
            <Reveal key={s.title} delay={(i % 4) * 0.07} className="h-full">
              <ServiceCard {...s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
