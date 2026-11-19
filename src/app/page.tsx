import { Contact } from "@/components/home/Contact";
import { Destinations } from "@/components/home/Destinations";
import { Hero } from "@/components/home/Hero";
import { Journey } from "@/components/home/Journey";
import { Services } from "@/components/home/Services";
import { UkOnshore } from "@/components/home/UkOnshore";

export default function Home() {
  return (
    <>
      <Hero />
      <Destinations />
      <Services />
      <Journey />
      <UkOnshore />
      <Contact />
    </>
  );
}
