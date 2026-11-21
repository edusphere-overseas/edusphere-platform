import { ArrowUpRight } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { Reveal } from "@/components/ui/Reveal";

/** Instagram follow card. Uses a link, not an embed, so no tracking scripts load. */
export function Instagram({ url, handle }: { url: string; handle?: string | null }) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col gap-6 overflow-hidden rounded-[2rem] border border-white/10 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10"
          >
            <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(120deg,rgba(254,218,117,0.16),rgba(214,41,118,0.2)_45%,rgba(79,91,213,0.22))] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="relative flex items-center gap-5">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)] text-white shadow-[0_18px_40px_-14px_rgba(214,41,118,0.7)]">
                <InstagramIcon className="h-8 w-8" />
              </span>
              <span>
                <span className="block text-2xl font-extrabold tracking-[-0.02em] text-white">Follow {handle || "us on Instagram"}</span>
                <span className="mt-1 block text-white/70">Admission updates, visa news, student moments and events.</span>
              </span>
            </span>
            <span className="relative inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-semibold text-deep transition group-hover:bg-mist sm:self-auto">
              Open Instagram
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
