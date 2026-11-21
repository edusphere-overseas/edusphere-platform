import type { Metadata } from "next";
import { School } from "lucide-react";
import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { UniversityList } from "@/components/pages/UniversityList";
import { Reveal } from "@/components/ui/Reveal";
import { flagOptions } from "@/sanity/options";
import { getLibrary, getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Universities",
  description: "Universities and colleges we help students apply to in the UK, Europe, Australia, New Zealand, the USA and Canada.",
};

export default async function UniversitiesPage() {
  const [c, lib] = await Promise.all([getSiteContent(), getLibrary()]);
  const countries = flagOptions.map((f) => ({ flag: f.value, name: f.title.replace(" (EU flag)", "") }));

  return (
    <>
      <PageHero
        eyebrow="Universities"
        crumbs={[{ href: "/universities", label: "Universities" }]}
        title={
          <>
            Universities we <span className="text-teal-light">work with</span>
          </>
        }
        intro="A selection of the universities and colleges our students apply to. Looking for one that isn't listed? Ask us: we can usually help."
      />
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {lib.universities.length > 0 ? (
            <UniversityList items={lib.universities} countries={countries} />
          ) : (
            <Reveal className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-white/15 p-8 sm:p-10">
              <School className="h-8 w-8 text-teal-light/60" aria-hidden="true" />
              <h2 className="text-2xl font-extrabold text-white">Our university list is being added</h2>
              <p className="max-w-2xl leading-relaxed text-white/65">
                We guide students to universities and colleges across all six destinations. Tell us your course and budget and we&apos;ll suggest the ones that fit.
              </p>
            </Reveal>
          )}
        </div>
      </section>
      <CtaBand whatsapp={c.whatsappNumber} title="Find the right university" text="Tell us your course, grades and budget. We'll shortlist universities that genuinely suit you." message="Hi Edusphere, I'd like help choosing a university." />
    </>
  );
}
