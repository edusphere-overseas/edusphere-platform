/**
 * The Edusphere mark (mortarboard over the open "E" base), redrawn as a
 * lightweight vector from the original logo. viewBox 0 0 316 264.
 *
 * variant="color" — brand colours for light backgrounds
 * variant="light" — brighter tones for the dark navy site background
 */

export const MARK_VIEWBOX = "0 0 316 264";

export const CAP_PATH =
  "M7 88.2 157.9 5.3 179.7 17.4 49.9 88.8 90.1 111.2 219.9 39.9 240.9 51.6 111.1 123 159.2 149.8 288.9 78.4 309.4 89.8 158.6 172.8Z";
export const TASSEL_DROP_PATH =
  "M24.4 175C26.5 181 32.5 184.5 32.5 190.2A7.9 7.9 0 0 1 16.7 190.2C16.7 184.5 22.5 181 24.4 175Z";
export const BASE_PATH =
  "M55 136V201.5L158.4 257.8 261.8 201.5V136L240.8 147.2V190L158.4 234.3 76 190V147.2Z";

export const markColors = {
  color: { cap: "#2C6085", base: "#449AA8" },
  light: { cap: "#5A9BD1", base: "#5CC0CF" },
} as const;

type Props = {
  variant?: keyof typeof markColors;
  className?: string;
  title?: string;
  /** Marks the header logo as the landing spot for the loading animation */
  introTarget?: boolean;
};

export function LogoMark({ variant = "light", className, title, introTarget }: Props) {
  const c = markColors[variant];
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      data-logo-mark={introTarget ? "" : undefined}
    >
      <path fill={c.cap} d={CAP_PATH} />
      <rect x="22" y="94" width="4.8" height="86" fill={c.cap} />
      <path fill={c.cap} d={TASSEL_DROP_PATH} />
      <path fill={c.base} fillRule="evenodd" d={BASE_PATH} />
    </svg>
  );
}
