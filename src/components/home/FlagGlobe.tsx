"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { LogoMark } from "@/components/brand/LogoMark";

type OrbitFlag = { code: string; name: string; href: string };

const inner: OrbitFlag[] = [
  { code: "gb", name: "United Kingdom", href: "#dest-uk" },
  { code: "ca", name: "Canada", href: "#dest-canada" },
  { code: "au", name: "Australia", href: "#dest-australia" },
  { code: "eu", name: "Europe", href: "#dest-europe" },
  { code: "us", name: "United States", href: "#dest-usa" },
  { code: "nz", name: "New Zealand", href: "#dest-new-zealand" },
];

const outer: OrbitFlag[] = [
  { code: "ie", name: "Ireland", href: "#dest-europe" },
  { code: "de", name: "Germany", href: "#dest-europe" },
  { code: "fr", name: "France", href: "#dest-europe" },
  { code: "nl", name: "Netherlands", href: "#dest-europe" },
  { code: "es", name: "Spain", href: "#dest-europe" },
  { code: "it", name: "Italy", href: "#dest-europe" },
];

function Ring({
  flags,
  radius,
  size,
  offset,
  className,
}: {
  flags: OrbitFlag[];
  radius: number; // % of the stage
  size: string;
  offset: number; // degrees
  className: string;
}) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      {flags.map((f, i) => {
        const a = ((360 / flags.length) * i + offset) * (Math.PI / 180);
        // Rounded so the server and the browser write the same value (no hydration warning)
        const left = (50 + radius * Math.cos(a)).toFixed(3);
        const top = (50 + radius * Math.sin(a)).toFixed(3);
        return (
          <a
            key={f.code}
            href={f.href}
            aria-label={`${f.name}: see study options`}
            className="group/flag absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span className="counter-spin relative block">
              <span
                className={`block overflow-hidden rounded-md shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] ring-2 ring-white/80 transition-transform duration-300 group-hover/flag:scale-125 group-focus-visible/flag:scale-125 ${size}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/flags/${f.code}.svg`} alt="" className="h-full w-full object-cover" draggable={false} />
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-bold text-deep opacity-0 shadow-lg transition-opacity duration-200 group-hover/flag:opacity-100 group-focus-visible/flag:opacity-100">
                {f.name}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

/** The hero "sphere": the Edusphere mark at the centre of orbiting flags. */
export function FlagGlobe() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [10, -10]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-8, 8]);
  const glowX = useTransform(sx, [-0.5, 0.5], ["40%", "60%"]);
  const glowY = useTransform(sy, [-0.5, 0.5], ["35%", "55%"]);

  return (
    <div
      className="globe relative mx-auto aspect-square w-[86%] max-w-[34rem] sm:w-full [perspective:1200px]"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div className="absolute inset-0" style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        {/* glow */}
        <div className="glow-pulse absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(92,192,207,0.35),rgba(90,155,209,0.12)_45%,transparent_70%)] blur-2xl" />

        {/* sphere */}
        <div className="absolute inset-[22%] overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_30%,#1d4a6e,#0f2a43_55%,#0a1c2e)] shadow-[inset_-20px_-30px_60px_rgba(0,0,0,0.45),0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
          <motion.div
            className="absolute h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_60%)]"
            style={{ left: glowX, top: glowY }}
          />
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full text-white/[0.09]" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="0.8">
              <ellipse cx="100" cy="100" rx="99" ry="99" />
              <ellipse cx="100" cy="100" rx="70" ry="99" />
              <ellipse cx="100" cy="100" rx="38" ry="99" />
              <line x1="100" y1="1" x2="100" y2="199" />
              <ellipse cx="100" cy="100" rx="99" ry="34" />
              <ellipse cx="100" cy="100" rx="99" ry="68" />
              <line x1="1" y1="100" x2="199" y2="100" />
            </g>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <LogoMark className="w-[46%] drop-shadow-[0_10px_25px_rgba(0,0,0,0.45)]" />
          </div>
        </div>

        {/* orbit paths */}
        <div className="absolute inset-[14%] rounded-full border border-dashed border-white/12" />
        <div className="absolute inset-[2%] rounded-full border border-white/[0.07]" />

        <Ring flags={inner} radius={36} size="h-9 w-12 sm:h-11 sm:w-[3.6rem]" offset={-90} className="orbit" />
        <Ring flags={outer} radius={48} size="h-6 w-8 sm:h-7 sm:w-[2.4rem]" offset={-60} className="orbit-reverse" />
      </motion.div>
    </div>
  );
}
