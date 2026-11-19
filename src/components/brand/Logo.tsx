import { LogoMark } from "./LogoMark";

type Props = {
  className?: string;
  showTagline?: boolean;
  /** "light" for dark backgrounds (default), "color" for light backgrounds */
  variant?: "light" | "color";
  introTarget?: boolean;
};

/** Horizontal lockup used in the header and footer. */
export function Logo({
  className = "",
  showTagline = true,
  variant = "light",
  introTarget = false,
}: Props) {
  const word = variant === "light" ? "text-white" : "text-slate";
  const tag = variant === "light" ? "text-teal-light/90" : "text-ink";
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark variant={variant} introTarget={introTarget} className="h-9 w-auto shrink-0 sm:h-10" />
      <span className="flex flex-col whitespace-nowrap leading-none">
        <span className={`text-[1.05rem] font-extrabold tracking-[-0.01em] sm:text-lg ${word}`}>
          Edusphere Overseas
        </span>
        {showTagline && (
          <span className={`mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] ${tag}`}>
            Your Guide to Study Abroad
          </span>
        )}
      </span>
    </span>
  );
}
