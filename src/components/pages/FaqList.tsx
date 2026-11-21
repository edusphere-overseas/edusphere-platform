import { ChevronDown } from "lucide-react";

export type FaqEntry = { question: string; answer: string };

/** Expanding questions. Uses <details>, so it works without JavaScript. */
export function FaqList({ items, tone = "dark" }: { items: FaqEntry[]; tone?: "dark" | "panel" }) {
  return (
    <div className="grid gap-3">
      {items.map((f) => (
        <details
          key={f.question}
          className={`group rounded-2xl border border-white/10 ${tone === "panel" ? "bg-panel/60" : "bg-white/[0.03]"} transition-colors open:border-teal-light/30`}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4.5 text-left font-semibold text-white sm:px-6 [&::-webkit-details-marker]:hidden">
            {f.question}
            <ChevronDown className="h-5 w-5 shrink-0 text-teal-light transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="px-5 pb-5 text-[0.97rem] leading-relaxed whitespace-pre-line text-white/70 sm:px-6">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

/** FAQPage structured data for the same questions. */
export function faqJsonLd(items: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
