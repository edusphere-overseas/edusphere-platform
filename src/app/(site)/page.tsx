import { Banners } from "@/components/home/Banners";
import { Contact } from "@/components/home/Contact";
import { Destinations } from "@/components/home/Destinations";
import { Hero } from "@/components/home/Hero";
import { Journey } from "@/components/home/Journey";
import { OpenNow } from "@/components/home/OpenNow";
import { Services } from "@/components/home/Services";
import { UkOnshore } from "@/components/home/UkOnshore";
import { getSiteContent, whatsappHref } from "@/lib/content";

export default async function Home() {
  const c = await getSiteContent();
  const show = c.sections;
  return (
    <>
      <Hero hero={c.hero} whatsapp={whatsappHref(c.whatsappNumber, c.whatsappMessage)} />
      {show.banners && <Banners banners={c.banners} whatsapp={c.whatsappNumber} />}
      {show.openNow && <OpenNow items={c.openNow} whatsapp={c.whatsappNumber} />}
      {show.destinations && <Destinations items={c.destinations} whatsapp={c.whatsappNumber} />}
      {show.services && <Services items={c.services} />}
      {show.journey && <Journey />}
      {show.ukOnshore && <UkOnshore programmes={c.onshore} whatsapp={c.whatsappNumber} />}
      <Contact offices={c.offices} contacts={c.contacts} whatsapp={c.whatsappNumber} />
    </>
  );
}
