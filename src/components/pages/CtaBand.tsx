import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { Reveal } from "@/components/ui/Reveal";
import { whatsappHref } from "@/lib/links";

type Props = {
  whatsapp: string;
  title?: string;
  text?: string;
  message?: string;
  consultHref?: string;
};

/** Closing call to action on inner pages. */
export function CtaBand({
  whatsapp,
  title = "Not sure where to start?",
  text = "Your first consultation is free, in person in Mangaluru or online. Students and parents are both welcome.",
  message = "Hi Edusphere, I'd like to book a free consultation.",
  consultHref = "/contact#enquiry",
}: Props) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(120deg,#16405f_0%,#13304a_55%,#0f2a43_100%)] p-8 sm:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal/25 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-balance text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">{title}</h2>
              <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">{text}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href={consultHref}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white transition hover:bg-teal-light"
              >
                Book a free consultation
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <a
                href={whatsappHref(whatsapp, message)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                WhatsApp us
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
