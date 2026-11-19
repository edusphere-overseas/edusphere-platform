"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { journeySteps } from "@/config/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

  return (
    <section id="journey" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From first question to first day"
          intro="A clear path with one team beside you. You always know what happens next."
          align="center"
        />

        <div ref={ref} className="relative mt-16">
          {/* line: vertical on mobile, horizontal on desktop */}
          <div aria-hidden="true" className="absolute top-0 bottom-0 left-[1.4rem] w-px bg-white/10 lg:top-[1.4rem] lg:right-[8%] lg:bottom-auto lg:left-[8%] lg:h-px lg:w-auto">
            <motion.div
              className="h-full w-full origin-top bg-gradient-to-b from-teal-light to-navy-light lg:hidden"
              style={{ scaleY: progress }}
            />
            <motion.div
              className="hidden h-full w-full origin-left bg-gradient-to-r from-teal-light to-navy-light lg:block"
              style={{ scaleX: progress }}
            />
          </div>

          <ol className="relative grid gap-10 lg:grid-cols-6 lg:gap-6">
            {journeySteps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.08} className="flex gap-5 lg:flex-col lg:items-center lg:text-center">
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-teal-light/40 bg-deep text-sm font-extrabold text-teal-light shadow-[0_0_0_6px_var(--color-deep)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-lg font-bold text-white lg:mt-5">{s.title}</span>
                  <span className="mt-1.5 block text-[0.93rem] leading-relaxed text-white/60">{s.text}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
