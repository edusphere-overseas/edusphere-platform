import Link from "next/link";
import { LogoMark } from "@/components/brand/LogoMark";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-5 py-28 text-center">
      <LogoMark className="w-24 opacity-90" />
      <h1 className="mt-8 text-3xl font-extrabold tracking-[-0.02em] text-white">This page took a different route</h1>
      <p className="mt-4 text-white/65">The page you were looking for isn&apos;t here. Let&apos;s get you back on the map.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-teal px-6 py-3 font-semibold text-white transition hover:bg-teal-light"
      >
        Back to home
      </Link>
    </section>
  );
}
