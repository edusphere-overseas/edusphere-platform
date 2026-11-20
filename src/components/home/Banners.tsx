"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { LogoMark } from "@/components/brand/LogoMark";
import { SanityImage } from "@/components/ui/SanityImage";
import { whatsappHref } from "@/lib/links";
import type { Banner } from "@/lib/content";

const INTERVAL_MS = 6500;

/** Rotating banners managed in Content → Home page → Banners. */
export function Banners({ banners, whatsapp }: { banners: Banner[]; whatsapp: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, count, go]);

  if (count === 0) return null;

  return (
    <section aria-roledescription="carousel" aria-label="Highlights" className="relative pt-14 sm:pt-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-panel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
            touchX.current = null;
          }}
        >
          <div className="grid">
            {banners.map((b, i) => {
              const active = i === index;
              const href = b.ctaLink || whatsappHref(whatsapp, `Hi Edusphere, I'd like to know more about: ${b.title}`);
              const external = href.startsWith("http");
              return (
                <article
                  key={b.id}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}`}
                  aria-hidden={!active}
                  className={`relative col-start-1 row-start-1 flex min-h-[22rem] items-end transition-opacity duration-700 ease-out sm:min-h-[20rem] lg:min-h-[22rem] ${
                    active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
                  }`}
                >
                  {/* background */}
                  {b.image ? (
                    <div className="absolute inset-0">
                      <SanityImage
                        photo={b.image}
                        fill
                        sizes="(min-width: 1280px) 1216px, 100vw"
                        className={`object-cover transition-transform duration-[7000ms] ease-out ${active ? "scale-105" : "scale-100"}`}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,24,42,0.95)_0%,rgba(8,24,42,0.75)_45%,rgba(8,24,42,0.2)_100%)]" />
                    </div>
                  ) : (
                    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[linear-gradient(120deg,#16405f_0%,#13304a_50%,#0f2a43_100%)]">
                      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-teal/25 blur-3xl" />
                      {b.flag ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/flags/${b.flag}.svg`}
                          alt=""
                          className={`absolute top-1/2 -right-10 h-[115%] -translate-y-1/2 rotate-[-10deg] rounded-[3rem] object-cover opacity-[0.16] transition-transform duration-[7000ms] ease-out sm:right-0 ${active ? "scale-105" : "scale-100"}`}
                        />
                      ) : (
                        <LogoMark
                          className={`absolute top-1/2 -right-16 h-[120%] w-auto -translate-y-1/2 opacity-[0.12] transition-transform duration-[7000ms] ease-out sm:right-4 ${active ? "scale-105" : "scale-100"}`}
                        />
                      )}
                    </div>
                  )}

                  {/* text */}
                  <div className="relative max-w-2xl p-7 pb-20 sm:p-12 sm:pb-20 lg:p-14 lg:pb-20">
                    {b.eyebrow && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
                        {b.flag && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/flags/${b.flag}.svg`} alt="" className="h-3.5 w-5 rounded-[2px] object-cover" />
                        )}
                        {b.eyebrow}
                      </span>
                    )}
                    <h2 className="mt-4 text-balance text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl">
                      {b.title}
                    </h2>
                    {b.subtitle && <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{b.subtitle}</p>}
                    <Link
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      tabIndex={active ? 0 : -1}
                      className="group mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-deep transition hover:bg-mist"
                    >
                      {b.ctaLabel || "Find out more"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {count > 1 && (
            <div className="absolute right-5 bottom-5 left-7 z-20 flex items-center justify-between gap-4 sm:left-12 lg:left-14">
              <div className="flex items-center gap-2">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Show banner ${i + 1}`}
                    aria-current={i === index}
                    className="group relative h-2.5 overflow-hidden rounded-full bg-white/25 transition-all duration-300"
                    style={{ width: i === index ? 40 : 10 }}
                  >
                    {i === index && (
                      <span
                        key={`${index}-${paused}`}
                        className="absolute inset-y-0 left-0 bg-white"
                        style={{
                          width: paused ? "100%" : undefined,
                          animation: paused ? undefined : `banner-progress ${INTERVAL_MS}ms linear forwards`,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  aria-label="Previous banner"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/10"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  aria-label="Next banner"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/10"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
