"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowRight, ArrowUpRight, CalendarDays, GraduationCap, RotateCcw } from "lucide-react";
import { whatsappHref } from "@/lib/links";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { DestinationCard as Destination } from "@/lib/content";

const shortName = (n: string) => (n === "United Kingdom" ? "the UK" : n === "United States" ? "the USA" : n);
const canHover = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Card that turns over to show intakes and next steps.
 * The turn runs in two halves (to edge-on, swap sides, back to flat), so it never
 * depends on backface-visibility, which Safari on iPhone renders unreliably.
 * Both sides share one grid cell, so the card never changes height.
 */
function DestinationCard({ d, whatsapp }: { d: Destination; whatsapp: string }) {
  const [side, setSide] = useState<"front" | "back">("front");
  const inner = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const backBtn = useRef<HTMLButtonElement>(null);
  const frontBtn = useRef<HTMLButtonElement>(null);

  async function turn(to: "front" | "back") {
    const el = inner.current;
    if (!el || busy.current) return;
    if (reduced() || typeof el.animate !== "function") {
      setSide(to);
      return;
    }
    busy.current = true;
    const dir = to === "back" ? 1 : -1;
    const frame = (deg: number, scale: number) => ({ transform: `perspective(1100px) rotateY(${deg}deg) scale(${scale})` });
    try {
      // Web Animations leave no transform behind once finished, so text stays crisp afterwards.
      const out = el.animate([frame(0, 1), frame(90 * dir, 0.97)], { duration: 160, easing: "cubic-bezier(0.4,0,1,1)", fill: "forwards" });
      await out.finished;
      flushSync(() => setSide(to));
      const back = el.animate([frame(-90 * dir, 0.97), frame(0, 1)], { duration: 240, easing: "cubic-bezier(0,0,0.2,1)" });
      out.cancel();
      await back.finished;
    } catch {
      setSide(to);
    } finally {
      busy.current = false;
      (to === "back" ? backBtn : frontBtn).current?.focus({ preventScroll: true });
    }
  }

  const front = side === "front";

  return (
    <div
      ref={tilt}
      id={`dest-${d.id}`}
      className="tilt group h-full scroll-mt-28 [perspective:1100px]"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !canHover() || reduced()) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        e.currentTarget.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
        e.currentTarget.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--rx", "0deg");
        e.currentTarget.style.setProperty("--ry", "0deg");
      }}
    >
      <div className="tilt-inner h-full">
        <div ref={inner} className="grid h-full [transform-style:flat]">
          {/* front */}
          <button
            ref={frontBtn}
            type="button"
            onClick={() => turn("back")}
            inert={!front}
            aria-hidden={!front || undefined}
            aria-label={`${d.name}: show intakes and next steps`}
            className={`relative col-start-1 row-start-1 flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-panel/70 p-6 text-left transition-[border-color,box-shadow] duration-300 hover:border-teal-light/40 hover:shadow-[0_30px_60px_-30px_rgba(92,192,207,0.45)] ${front ? "" : "invisible"}`}
          >
            <span className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-teal/10 blur-3xl" aria-hidden="true" />
            <span className="relative block aspect-[4/3] w-24 overflow-hidden rounded-xl shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)] ring-1 ring-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/flags/${d.flag}.svg`} alt="" className="flag-wave h-full w-full object-cover" draggable={false} />
            </span>
            <span className="relative mt-6 block text-2xl font-extrabold tracking-[-0.02em] text-white">{d.name}</span>
            <span className="relative mt-2 block flex-1 text-[0.95rem] leading-relaxed text-white/65">{d.summary}</span>
            {d.countries && d.countries.length > 0 && (
              <span className="relative mt-4 flex -space-x-1.5" aria-hidden="true">
                {d.countries.slice(0, 6).map((c) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={c.flag} src={`/flags/${c.flag}.svg`} alt="" className="h-5 w-5 rounded-full object-cover ring-2 ring-panel" />
                ))}
              </span>
            )}
            <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-light">
              <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" aria-hidden="true" />
              Intakes and next steps
            </span>
          </button>

          {/* back */}
          <div
            inert={front}
            aria-hidden={front || undefined}
            className={`col-start-1 row-start-1 flex h-full flex-col rounded-3xl border border-teal-light/30 bg-[linear-gradient(150deg,#16405f,#0f2a43)] p-6 ${front ? "invisible" : ""}`}
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/flags/${d.flag}.svg`} alt="" className="h-7 w-10 rounded-md object-cover ring-1 ring-white/25" />
              <span className="text-lg font-extrabold text-white">{d.name}</span>
            </div>
            <p className="mt-5 flex items-start gap-2.5 text-[0.95rem] leading-relaxed text-white/85">
              <CalendarDays className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal-light" aria-hidden="true" />
              {d.intakes || "Intakes vary by university. Ask us for the next dates."}
            </p>
            {d.tuition && (
              <p className="mt-2.5 flex items-start gap-2.5 text-[0.95rem] leading-relaxed text-white/75">
                <GraduationCap className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal-light" aria-hidden="true" />
                {d.tuition}
              </p>
            )}
            {d.countries && d.countries.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Countries">
                {d.countries.map((c) => (
                  <li key={c.flag} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/flags/${c.flag}.svg`} alt="" className="h-2.5 w-3.5 rounded-[1px] object-cover" />
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/destinations/${d.id}`} className="group/link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:underline">
              Explore {shortName(d.name)}
              <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" aria-hidden="true" />
            </Link>
            <div className="mt-auto flex items-center justify-between gap-3 pt-6">
              <a
                href={whatsappHref(whatsapp, `Hi Edusphere, I'm interested in studying in ${shortName(d.name)}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-light"
              >
                Ask on WhatsApp
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                ref={backBtn}
                type="button"
                onClick={() => turn("front")}
                className="rounded-full p-2.5 text-white/70 ring-1 ring-white/20 transition hover:text-white"
                aria-label={`Back to ${d.name}`}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Destinations({ items, whatsapp }: { items: Destination[]; whatsapp: string }) {
  if (items.length === 0) return null;
  return (
    <section id="destinations" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Destinations"
            title={
              <>
                Where will you
                <span className="text-teal-light"> study?</span>
              </>
            }
            intro="Each destination has its own rhythm of intakes, costs and visas. We know them well, and we'll help you weigh them honestly."
          />
          <Reveal delay={0.1} className="flex items-center gap-5 text-sm">
            <span className="text-white/50">Tap a card for intakes</span>
            <Link href="/destinations" className="group inline-flex items-center gap-1.5 font-semibold text-teal-light hover:underline">
              All destinations
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d, i) => (
            <Reveal key={d.id} delay={(i % 3) * 0.08} className="h-full">
              <DestinationCard d={d} whatsapp={whatsapp} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
