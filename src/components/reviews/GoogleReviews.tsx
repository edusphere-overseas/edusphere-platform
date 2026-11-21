import { ArrowUpRight, Star } from "lucide-react";
import { GoogleIcon } from "@/components/icons";
import type { PlaceReviews } from "@/lib/reviews";

function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block">
            <Star className={`${className} text-white/20`} aria-hidden="true" fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${className} text-[#fbbc04]`} aria-hidden="true" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Rating summary plus reviews, exactly as Google returns them, with Google attribution. */
export function GoogleReviews({ data, limit = 5, clamp = false }: { data: PlaceReviews; limit?: number; clamp?: boolean }) {
  const reviews = data.reviews.slice(0, limit);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
            <GoogleIcon className="h-6 w-6 text-deep" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white/60">Google reviews</p>
            {data.rating !== null && (
              <p className="mt-0.5 flex items-center gap-2.5">
                <span className="text-2xl font-extrabold text-white">{data.rating.toFixed(1)}</span>
                <Stars value={data.rating} />
                {data.count !== null && <span className="text-sm text-white/55">{data.count} reviews</span>}
              </p>
            )}
          </div>
        </div>
        {data.mapsUrl && (
          <a
            href={data.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5"
          >
            See all on Google
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>

      {reviews.length > 0 && (
        <ul className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <li key={`${r.author}-${i}`} className="flex flex-col rounded-3xl border border-white/10 bg-panel/50 p-6">
              <div className="flex items-center gap-3">
                {r.authorPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.authorPhoto} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/30 font-bold text-white">{r.author.charAt(0)}</span>
                )}
                <div className="min-w-0">
                  {r.authorUrl ? (
                    <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="block truncate font-semibold text-white hover:underline">
                      {r.author}
                    </a>
                  ) : (
                    <span className="block truncate font-semibold text-white">{r.author}</span>
                  )}
                  <span className="text-xs text-white/50">{r.when}</span>
                </div>
              </div>
              <div className="mt-4">
                <Stars value={r.rating} className="h-3.5 w-3.5" />
              </div>
              <p className={`mt-3 flex-1 text-[0.95rem] leading-relaxed whitespace-pre-line text-white/75 ${clamp ? "line-clamp-6" : ""}`}>{r.text}</p>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-light hover:underline">
                  Read on Google
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-white/40">Reviews and rating are provided by Google and shown as published.</p>
    </div>
  );
}
