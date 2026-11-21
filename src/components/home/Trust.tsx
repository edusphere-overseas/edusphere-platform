"use client";

import { useEffect, useRef, useState } from "react";

type Stat = { value: string; label: string };

function parse(v: string) {
  const m = v.match(/^(\D*)(\d[\d,]*)(.*)$/);
  if (!m) return null;
  return { prefix: m[1], n: Number(m[2].replace(/,/g, "")), suffix: m[3] };
}

/** Numbers that count up when they scroll into view. Values are set in Content → Website settings → Numbers. */
export function Trust({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(1); // 0 → 1 progress; starts at 1 so the real numbers render without JavaScript

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) return; // already on screen: leave the final numbers
    setT(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 1400);
          setT(1 - Math.pow(1 - p, 3));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  if (stats.length === 0) return null;

  return (
    <section aria-label="Edusphere in numbers" className="relative pt-14 sm:pt-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div
          ref={ref}
          className={`grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 ${stats.length >= 4 ? "lg:grid-cols-4" : stats.length === 3 ? "sm:grid-cols-3" : ""}`}
        >
          {stats.map((s, i) => {
            const p = parse(s.value);
            return (
              <div key={`${s.label}-${i}`} className={`bg-deep px-5 py-7 sm:px-8 sm:py-9 ${stats.length === 3 && i === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
                <p className="text-4xl font-extrabold tracking-[-0.03em] text-white tabular-nums sm:text-5xl">
                  {p ? (
                    <>
                      {p.prefix}
                      {Math.round(p.n * t).toLocaleString("en-IN")}
                      <span className="text-teal-light">{p.suffix}</span>
                    </>
                  ) : (
                    <span className="transition-opacity duration-700" style={{ opacity: 0.25 + 0.75 * t }}>
                      {s.value}
                    </span>
                  )}
                </p>
                <p className="mt-2 text-sm font-medium text-white/60 sm:text-base">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
