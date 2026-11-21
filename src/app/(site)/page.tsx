import { Banners } from "@/components/home/Banners";
import { Contact } from "@/components/home/Contact";
import { CourseCta } from "@/components/home/CourseCta";
import { Destinations } from "@/components/home/Destinations";
import { Hero } from "@/components/home/Hero";
import { Instagram } from "@/components/home/Instagram";
import { Journey } from "@/components/home/Journey";
import { NewsTeaser } from "@/components/home/NewsTeaser";
import { OpenNow } from "@/components/home/OpenNow";
import { Services } from "@/components/home/Services";
import { Stories } from "@/components/home/Stories";
import { Trust } from "@/components/home/Trust";
import { UkOnshore } from "@/components/home/UkOnshore";
import { getSiteContent, whatsappHref } from "@/lib/content";
import { getPlaceReviews } from "@/lib/reviews";

export default async function Home() {
  const c = await getSiteContent();
  const show = c.sections;
  const head = c.offices[0];
  const reviews = show.reviews ? await getPlaceReviews(head) : null;
  const instagram = c.socialLinks.find((l) => l.platform === "instagram");
  const googleUrl = show.reviews ? head?.googleBusinessUrl || c.socialLinks.find((l) => l.platform === "google")?.url : null;

  return (
    <>
      <Hero hero={c.hero} whatsapp={whatsappHref(c.whatsappNumber, c.whatsappMessage)} />
      {show.banners && <Banners banners={c.banners} whatsapp={c.whatsappNumber} />}
      {show.trust && <Trust stats={c.stats} />}
      {show.openNow && <OpenNow items={c.openNow} whatsapp={c.whatsappNumber} />}
      {show.destinations && <Destinations items={c.destinations} whatsapp={c.whatsappNumber} />}
      {show.services && <Services items={c.services} />}
      {show.journey && <Journey />}
      <CourseCta finderOn={show.courseFinder} whatsapp={c.whatsappNumber} />
      {(show.stories || show.reviews) && <Stories stories={show.stories ? c.stories : []} reviews={reviews} googleUrl={googleUrl} />}
      {show.ukOnshore && <UkOnshore programmes={c.onshore} whatsapp={c.whatsappNumber} />}
      {show.news && <NewsTeaser posts={c.posts} nextEvent={c.nextEvent} />}
      {show.instagram && instagram && <Instagram url={instagram.url} handle={instagram.handle} />}
      <Contact offices={c.offices} contacts={c.contacts} whatsapp={c.whatsappNumber} />
    </>
  );
}
