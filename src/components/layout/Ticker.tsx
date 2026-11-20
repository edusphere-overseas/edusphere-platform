type Item = { tag: string; text: string; link?: string | null };

/** Running news line above the header. Managed in Content → Home page → News ticker. */
export function Ticker({ items }: { items: Item[] }) {
  if (items.length === 0) return null;

  const row = (copy: number) =>
    items.map((item, i) => {
      const body = (
        <>
          <span className="rounded-full bg-teal/20 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-teal-light">
            {item.tag}
          </span>
          <span className="text-white/80">{item.text}</span>
        </>
      );
      const external = item.link?.startsWith("http");
      return (
        <li key={`${copy}-${i}`} className="flex shrink-0 items-center gap-2.5 pr-12" aria-hidden={copy > 0 || undefined}>
          {item.link ? (
            <a
              href={item.link}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              tabIndex={copy > 0 ? -1 : undefined}
              className="flex items-center gap-2.5 hover:text-white"
            >
              {body}
            </a>
          ) : (
            body
          )}
          <span className="ml-10 h-1 w-1 rounded-full bg-white/25" aria-hidden="true" />
        </li>
      );
    });

  return (
    <section aria-label="Latest updates" className="relative z-40 border-b border-white/5 bg-deeper text-[0.78rem]">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-4 px-5 sm:px-8">
        <span className="hidden shrink-0 items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-light opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-light" />
          </span>
          Updates
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
          <ul className="marquee-track flex w-max animate-marquee">
            {row(0)}
            {row(1)}
          </ul>
        </div>
      </div>
    </section>
  );
}
