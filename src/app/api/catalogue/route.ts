import { NextResponse, type NextRequest } from "next/server";
import { isCountry, searchCourses, searchUniversities } from "@/lib/catalogue";

/**
 * Search for the university and course pickers on the apply and portal forms.
 *   /api/catalogue?kind=universities&country=uk&q=leeds
 *   /api/catalogue?kind=courses&u=uk-10003861&q=computer
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").slice(0, 80);
  const country = sp.get("country") ?? "";
  const headers = { "cache-control": "public, max-age=300, s-maxage=3600" };

  if (sp.get("kind") === "courses") {
    const u = sp.get("u") ?? "";
    if (!/^[a-z]{2}-[A-Za-z0-9]{1,30}$/.test(u)) return NextResponse.json({ items: [] }, { headers });
    const { items, total } = await searchCourses({ q, university: u, limit: 30 });
    return NextResponse.json({ total, items: items.map((c) => ({ title: c.title, level: c.level })) }, { headers });
  }

  const { items, total } = await searchUniversities({ q, country: isCountry(country) ? country : undefined, limit: 12 });
  return NextResponse.json(
    {
      total,
      items: items.map((u) => ({ id: u.id, name: u.name, country: u.country, place: [u.city, u.region].filter(Boolean).join(", "), courses: u.courses })),
    },
    { headers },
  );
}
