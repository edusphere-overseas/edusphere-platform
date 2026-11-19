import { Reveal } from "./Reveal";

type Props = {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
};

export function SectionHeading({ eyebrow, title, intro, align = "left", tone = "dark" }: Props) {
  const center = align === "center" ? "mx-auto text-center items-center" : "";
  const titleColor = tone === "dark" ? "text-white" : "text-deep";
  const introColor = tone === "dark" ? "text-white/70" : "text-slate";
  return (
    <Reveal className={`flex max-w-2xl flex-col ${center}`}>
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-teal-light">
        <span className="h-px w-6 bg-teal-light/70" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 className={`mt-4 text-balance text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-4xl lg:text-[2.75rem] ${titleColor}`}>
        {title}
      </h2>
      {intro && <p className={`mt-5 text-base leading-relaxed sm:text-lg ${introColor}`}>{intro}</p>}
    </Reveal>
  );
}
