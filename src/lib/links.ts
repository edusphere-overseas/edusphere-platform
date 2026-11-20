/** Link helpers that are safe to use in both server and client components. */
const digits = (v: string) => v.replace(/\D/g, "");

export const telHref = (value: string) => `tel:${value.replace(/[^\d+]/g, "")}`;

export const whatsappHref = (number: string, message?: string) =>
  `https://wa.me/${digits(number)}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
