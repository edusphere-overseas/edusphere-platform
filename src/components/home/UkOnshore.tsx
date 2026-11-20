import { ArrowUpRight, Check, MapPin } from "lucide-react";
import { whatsappHref, type SiteContent } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";

const points = [
  "Onshore admission programmes for students already in the UK",
  "Planning around the Graduate route after your course",
  "Applications and documents prepared with you, step by step",
];

export function UkOnshore({ programmes, whatsapp }: { programmes: SiteContent["onshore"]; whatsapp: string }) {
  return (
    <section id="uk-onshore" className="relative scroll-mt-20 pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(120deg,#16405f_0%,#13304a_45%,#0f2a43_100%)] p-8 sm:p-12 lg:p-16">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -bottom-24 h-[26rem] w-[26rem] rotate-[-12deg] opacity-[0.13] sm:-right-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/flags/gb.svg" alt="" className="h-full w-full rounded-[3rem] object-cover" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/flags/gb.svg" alt="" className="h-3.5 w-5 rounded-[2px] object-cover" />
                UK onshore
              </span>
              <h2 className="mt-5 text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl">
                Already studying in the UK?
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
                Your next step can start where you are. We help students in the UK explore onshore admission
                programmes and plan the move into post-study work.
              </p>
              <a
                href={whatsappHref(whatsapp, "Hi Edusphere, I'm in the UK and would like to know about onshore programmes.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-deep transition hover:bg-mist"
              >
                Ask about onshore programmes
                <ArrowUpRight className="h-4.5 w-4.5" aria-hidden="true" />
              </a>
            </div>

            <ul className="grid gap-3">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-deep/40 p-4 backdrop-blur">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-light/20 text-teal-light">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-[0.95rem] leading-relaxed text-white/85">{p}</span>
                </li>
              ))}
              <li className="px-1 pt-2 text-xs leading-relaxed text-white/50">
                UK immigration advice is given only by advisers regulated to provide it.
              </li>
            </ul>
          </div>

          {programmes.length > 0 && (
            <div className="relative mt-10 border-t border-white/10 pt-8">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Current onshore programmes</h3>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {programmes.map((p) => (
                  <li key={p._id} className="rounded-2xl border border-white/10 bg-deep/50 p-5">
                    <p className="font-bold text-white">{p.title}</p>
                    {(p.provider || p.location) && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/60">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {[p.provider, p.location].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {p.summary && <p className="mt-3 text-sm leading-relaxed text-white/75">{p.summary}</p>}
                    {p.intakes && <p className="mt-3 text-xs font-semibold text-teal-light">{p.intakes}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
