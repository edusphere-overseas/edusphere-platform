import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { flagStrip, whatsappLink } from "@/config/site";
import { WhatsAppIcon } from "@/components/icons";
import { FlagGlobe } from "./FlagGlobe";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* background: soft glows and a faint map grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-navy/40 blur-[120px]" />
        <div className="absolute top-20 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-teal/25 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000,transparent)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pt-10 pb-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pt-16 lg:pb-20">
        <div className="relative z-10">
          <p className="hero-in inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur" style={{ ["--d" as string]: "0s" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-teal-light" aria-hidden="true" />
            <span>
              Study abroad consultancy · <span className="hidden sm:inline">Head office in </span>Mangaluru
            </span>
          </p>

          <h1 className="mt-6 text-[clamp(2.7rem,7.5vw,5.4rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
            <span className="hero-in block" style={{ ["--d" as string]: "0.08s" }}>
              Your future,
            </span>
            <span
              className="hero-in block bg-[linear-gradient(100deg,#5cc0cf,#5a9bd1_55%,#a9d4f0)] bg-clip-text pb-2 text-transparent"
              style={{ ["--d" as string]: "0.18s" }}
            >
              mapped out.
            </span>
          </h1>

          <p className="hero-in mt-6 max-w-xl text-lg leading-relaxed text-white/75" style={{ ["--d" as string]: "0.3s" }}>
            Personal guidance for studying in the UK, Europe, Australia, New Zealand, the USA and Canada. From your
            first question to your first day on campus, one team walks the whole way with you.
          </p>

          <div className="hero-in mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ ["--d" as string]: "0.42s" }}>
            <Link
              href="/#contact"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white shadow-[0_14px_40px_-12px_rgba(68,154,168,0.9)] transition hover:bg-teal-light"
            >
              Book a free consultation
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5 hover:ring-white/45"
            >
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              Chat on WhatsApp
            </a>
          </div>

          <p className="hero-in mt-8 text-sm text-white/55" style={{ ["--d" as string]: "0.54s" }}>
            Free first consultation · In person in Mangaluru or online, wherever you are
          </p>
        </div>

        <div className="hero-in relative" style={{ ["--d" as string]: "0.2s" }}>
          <FlagGlobe />
        </div>
      </div>

      {/* flag strip */}
      <div className="relative border-y border-white/8 bg-white/[0.02] py-4">
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <ul className="marquee-track flex w-max animate-marquee-slow" aria-label="Countries we guide students to">
            {[0, 1].map((copy) =>
              flagStrip.map((f) => (
                <li
                  key={`${copy}-${f.code}`}
                  aria-hidden={copy > 0 || undefined}
                  className="group flex shrink-0 items-center gap-3 pr-10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/flags/${f.code}.svg`}
                    alt=""
                    className="flag-wave h-5 w-7 rounded-[3px] object-cover ring-1 ring-white/20"
                  />
                  <span className="text-sm font-semibold text-white/70 transition-colors group-hover:text-white">{f.name}</span>
                </li>
              )),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
