import type { Metadata } from "next";
import { CtaBand } from "@/components/pages/CtaBand";
import { FaqList, faqJsonLd } from "@/components/pages/FaqList";
import { PageHero } from "@/components/pages/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { getLibrary, getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers for students and parents about studying abroad: timelines, visas, costs, funding and support after you arrive.",
};

const categories: Record<string, string> = {
  start: "Getting started",
  visa: "Visas",
  costs: "Costs and funding",
  parents: "For parents",
  arrival: "After you arrive",
};

export default async function FaqsPage() {
  const [c, lib] = await Promise.all([getSiteContent(), getLibrary()]);
  const groups = new Map<string, { question: string; answer: string }[]>();
  for (const f of lib.faqs) {
    const k = f.category && categories[f.category] ? f.category : "general";
    groups.set(k, [...(groups.get(k) ?? []), f]);
  }
  const ordered = [...Object.keys(categories), "general"].filter((k) => groups.has(k));

  return (
    <>
      <JsonLd data={faqJsonLd(lib.faqs)} />
      <PageHero
        eyebrow="FAQs"
        crumbs={[{ href: "/faqs", label: "FAQs" }]}
        title={
          <>
            Questions, <span className="text-teal-light">answered</span>
          </>
        }
        intro="The questions students and parents ask us most. If yours isn't here, ask us on WhatsApp."
      />
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-4xl gap-12 px-5 sm:px-8">
          {ordered.map((k) => (
            <Reveal key={k}>
              {ordered.length > 1 && <h2 className="mb-5 text-xl font-bold text-white">{categories[k] ?? "General"}</h2>}
              <FaqList items={groups.get(k) ?? []} />
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand whatsapp={c.whatsappNumber} title="Still have a question?" text="Ask us anything about studying abroad. A counsellor will reply, usually the same day." message="Hi Edusphere, I have a question about studying abroad." />
    </>
  );
}
