"use client";

import { useEffect, useRef } from "react";
import {
  BASE_PATH,
  CAP_PATH,
  MARK_VIEWBOX,
  TASSEL_DROP_PATH,
  markColors,
} from "./LogoMark";

const WORD = "Edusphere Overseas";

/**
 * Logo loading animation. Plays on a first visit and again after time away;
 * length and replay rule are set in Content → Website settings → Logo intro.
 * An inline script in the page head decides before first paint whether it
 * plays, so it never flashes. The drawing, the hold and the fading of the
 * words run in pure CSS; JavaScript adds the glide into the header logo and
 * tap-to-skip. With "reduce motion" on, a calm fade plays instead.
 */
export function Intro() {
  const ref = useRef<HTMLDivElement>(null);

  // Remember the visit (also on leave), so the intro only replays after time away.
  useEffect(() => {
    const stamp = () => {
      try {
        localStorage.setItem("es-intro", String(Date.now()));
      } catch {}
    };
    stamp();
    const onHide = () => document.visibilityState === "hidden" && stamp();
    window.addEventListener("pagehide", stamp);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", stamp);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    const root = document.documentElement;
    if (!el || root.dataset.intro === "skip") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const finish = () => {
      el.classList.add("is-done");
      root.dataset.intro = "done"; // shows the header logo
    };
    const total =
      parseFloat(getComputedStyle(root).getPropertyValue("--intro-total")) ||
      2.5;

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timers.push(setTimeout(finish, total * 1000));
      return () => timers.forEach(clearTimeout);
    }
    // If the page was slow and the CSS fallback has already begun fading out, let it finish.
    if (parseFloat(getComputedStyle(el).opacity) < 1) {
      timers.push(setTimeout(finish, 600));
      return () => timers.forEach(clearTimeout);
    }

    const glide = () => {
      const mark = el.querySelector<SVGSVGElement>(".intro-mark");
      const target = document.querySelector<SVGSVGElement>(
        "header [data-logo-mark]",
      );
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
      timers.push(setTimeout(finish, 520));
    };

    // The glide starts the moment the words have faded (a CSS animation timed from first paint).
    const words = el.querySelector<HTMLElement>(".intro-words");
    const onEnd = (e: AnimationEvent) => e.target === words && glide();
    if (!words || parseFloat(getComputedStyle(words).opacity) <= 0.01) glide();
    else words.addEventListener("animationend", onEnd);

    return () => {
      words?.removeEventListener("animationend", onEnd);
      timers.forEach(clearTimeout);
    };
  }, []);

  const c = markColors.light;

  return (
    <div
      ref={ref}
      className="intro"
      aria-hidden="true"
      onClick={() => {
        ref.current?.classList.add("is-done");
        document.documentElement.dataset.intro = "done";
      }}
    >
      <div className="relative flex flex-col items-center px-6 text-center">
        <svg
          className="intro-mark"
          viewBox={MARK_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cap drawn as four strokes, then swapped for the exact shape */}
          <g
            className="cap-strokes"
            stroke={c.cap}
            strokeWidth="21"
            fill="none"
          >
            <path
              className="draw draw-spine"
              pathLength={1}
              d="M12.9 79.8 163.8 164"
            />
            <path
              className="draw draw-bar1"
              pathLength={1}
              d="M28.5 88.5 168.8 11.4"
            />
            <path
              className="draw draw-bar2"
              pathLength={1}
              d="M90.1 122.9 230.4 45.7"
            />
            <path
              className="draw draw-bar3"
              pathLength={1}
              d="M158.9 161.3 299.2 84.1"
            />
          </g>
          <path className="cap-fill" fill={c.cap} d={CAP_PATH} />
          <rect
            className="tassel-string"
            x="22"
            y="94"
            width="4.8"
            height="86"
            fill={c.cap}
          />
          <path className="tassel-drop" fill={c.cap} d={TASSEL_DROP_PATH} />
          <path
            className="base"
            fill={c.base}
            fillRule="evenodd"
            d={BASE_PATH}
          />
        </svg>

        <div className="intro-words">
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
    </div>
  );
}
