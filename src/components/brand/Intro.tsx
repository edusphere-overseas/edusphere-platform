"use client";

import { useEffect, useRef } from "react";
import { BASE_PATH, CAP_PATH, MARK_VIEWBOX, TASSEL_DROP_PATH, markColors } from "./LogoMark";

const WORD = "Edusphere Overseas";

/**
 * Logo loading animation. Plays once per browser session (an inline script in
 * the layout marks repeat visits before first paint so it never flashes).
 * The drawing runs in pure CSS, so it starts immediately and hides itself
 * even if JavaScript is slow; JavaScript adds the glide into the header logo
 * and tap-to-skip. Total time about 1.6 seconds. Skipped for "reduce motion".
 */
export function Intro() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.documentElement.dataset.intro === "skip") return;
    try {
      sessionStorage.setItem("es-intro", "1");
    } catch {}
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // If the page was slow and the CSS fallback has already begun fading out, let it finish.
    if (parseFloat(getComputedStyle(el).opacity) < 1) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const glide = () => {
      const mark = el.querySelector<SVGSVGElement>(".intro-mark");
      const target = document.querySelector<SVGSVGElement>("header [data-logo-mark]");
      el.classList.add("is-gliding");
      if (mark && target) {
        const a = mark.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        if (b.width > 0 && b.bottom > 0 && b.top < innerHeight) {
          const s = b.width / a.width;
          const dx = b.left + b.width / 2 - (a.left + a.width / 2);
          const dy = b.top + b.height / 2 - (a.top + a.height / 2);
          mark.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
        }
      }
      timers.push(setTimeout(() => el.classList.add("is-done"), 520));
    };

    const tagline = el.querySelector<HTMLElement>(".tagline");
    const onEnd = () => timers.push(setTimeout(glide, 60));
    if (!tagline || parseFloat(getComputedStyle(tagline).opacity) >= 1) onEnd();
    else tagline.addEventListener("animationend", onEnd, { once: true });

    return () => {
      tagline?.removeEventListener("animationend", onEnd);
      timers.forEach(clearTimeout);
    };
  }, []);

  const c = markColors.light;

  return (
    <div
      ref={ref}
      className="intro"
      aria-hidden="true"
      onClick={() => ref.current?.classList.add("is-done")}
    >
      <div className="relative flex flex-col items-center px-6 text-center">
        <svg className="intro-mark" viewBox={MARK_VIEWBOX} xmlns="http://www.w3.org/2000/svg">
          {/* Cap drawn as four strokes, then swapped for the exact shape */}
          <g className="cap-strokes" stroke={c.cap} strokeWidth="21" fill="none">
            <path className="draw draw-spine" pathLength={1} d="M12.9 79.8 163.8 164" />
            <path className="draw draw-bar1" pathLength={1} d="M28.5 88.5 168.8 11.4" />
            <path className="draw draw-bar2" pathLength={1} d="M90.1 122.9 230.4 45.7" />
            <path className="draw draw-bar3" pathLength={1} d="M158.9 161.3 299.2 84.1" />
          </g>
          <path className="cap-fill" fill={c.cap} d={CAP_PATH} />
          <rect className="tassel-string" x="22" y="94" width="4.8" height="86" fill={c.cap} />
          <path className="tassel-drop" fill={c.cap} d={TASSEL_DROP_PATH} />
          <path className="base" fill={c.base} fillRule="evenodd" d={BASE_PATH} />
        </svg>

        <p className="intro-text mt-7 text-[clamp(1.5rem,5.5vw,2.4rem)] font-extrabold tracking-[-0.01em] text-white">
          {Array.from(WORD).map((ch, i) => (
            <span key={i} className="letter" style={{ ["--i" as string]: i }}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </p>
        <p className="intro-text tagline mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-teal-light">
          Your Guide to Study Abroad
        </p>
      </div>
    </div>
  );
}
