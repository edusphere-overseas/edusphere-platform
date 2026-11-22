import { Check } from "lucide-react";
import { STAGES, stageIndex, stageLabel } from "@/lib/portal/journey";
import { formatDate } from "./ui";

/** Nine short segments: done, current, still to come. */
export function StageBar({ stage, country, muted }: { stage: string; country?: string | null; muted?: boolean }) {
  const at = stageIndex(stage);
  return (
    <div>
      <div className="flex gap-1" aria-hidden="true">
        {STAGES.map((s, i) => (
          <span
            key={s.key}
            className={`h-2 flex-1 rounded-full ${muted ? "bg-slate/20" : i < at ? "bg-teal" : i === at ? "bg-teal/45 ring-2 ring-teal" : "bg-slate/15"}`}
          />
        ))}
      </div>
      <p className="sr-only">
        Stage {at + 1} of {STAGES.length}: {stageLabel(stage, country)}
      </p>
    </div>
  );
}

/** Every stage, with the date each one was reached. */
export function StageSteps({ stage, country, reached }: { stage: string; country?: string | null; reached: Record<string, string> }) {
  const at = stageIndex(stage);
  return (
    <ol className="relative grid gap-0">
      {STAGES.map((s, i) => {
        const done = i < at;
        const current = i === at;
        return (
          <li key={s.key} className="relative flex gap-3.5 pb-4 last:pb-0">
            {i < STAGES.length - 1 && (
              <span aria-hidden="true" className={`absolute top-7 bottom-0 left-[0.8125rem] w-0.5 ${done ? "bg-teal" : "bg-slate/15"}`} />
            )}
            <span
              className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                done ? "bg-teal text-white" : current ? "bg-white text-teal ring-2 ring-teal" : "bg-white text-slate/60 ring-1 ring-slate/25"
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>
            <div className="pt-0.5">
              <p className={`text-sm font-semibold ${current ? "text-deep" : done ? "text-deep/80" : "text-slate/70"}`}>
                {stageLabel(s.key, country)}
                {current && <span className="ml-2 rounded-full bg-teal/12 px-2 py-0.5 text-[0.7rem] font-bold text-navy">Now</span>}
              </p>
              {reached[s.key] && (done || current) && <p className="text-xs text-slate">{formatDate(reached[s.key])}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
