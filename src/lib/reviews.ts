import { cacheLife, cacheTag } from "next/cache";

export type GoogleReview = {
  author: string;
  authorUrl?: string | null;
  authorPhoto?: string | null;
  rating: number;
  text: string;
  when: string; // "2 months ago", as Google gives it
  url?: string | null;
};

export type PlaceReviews = {
  name: string;
  rating: number | null;
  count: number | null;
  mapsUrl: string | null;
  reviews: GoogleReview[];
};

type PlaceResponse = {
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating?: number;
    text?: { text?: string };
    originalText?: { text?: string };
    relativePublishTimeDescription?: string;
    googleMapsUri?: string;
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  }[];
};

const API = "https://places.googleapis.com/v1";

/** Finds a Place ID from the office name and address. "IDs only" text search has no charge. */
async function findPlaceId(key: string, query: string): Promise<string | null> {
  const res = await fetch(`${API}/places:searchText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id" },
    body: JSON.stringify({ textQuery: query, pageSize: 1 }),
  });
  if (!res.ok) throw new Error(`Text search ${res.status}`);
  const data = (await res.json()) as { places?: { id: string }[] };
  return data.places?.[0]?.id ?? null;
}

async function loadReviews(placeId: string | null, query: string): Promise<PlaceReviews | null> {
  "use cache";
  cacheTag("google-reviews");
  // Refreshed about twice a day: well inside Google's free monthly allowance.
  cacheLife({ stale: 3600, revalidate: 43200, expire: 86400 });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  try {
    const id = placeId || (await findPlaceId(key, query));
    if (!id) return null;
    const res = await fetch(`${API}/places/${encodeURIComponent(id)}?languageCode=en`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "displayName,rating,userRatingCount,googleMapsUri,reviews",
      },
    });
    if (!res.ok) throw new Error(`Place details ${res.status}`);
    const p = (await res.json()) as PlaceResponse;
    return {
      name: p.displayName?.text ?? "",
      rating: p.rating ?? null,
      count: p.userRatingCount ?? null,
      mapsUrl: p.googleMapsUri ?? null,
      reviews: (p.reviews ?? [])
        .map((r) => ({
          author: r.authorAttribution?.displayName ?? "Google user",
          authorUrl: r.authorAttribution?.uri ?? null,
          authorPhoto: r.authorAttribution?.photoUri ?? null,
          rating: r.rating ?? 0,
          text: r.text?.text ?? r.originalText?.text ?? "",
          when: r.relativePublishTimeDescription ?? "",
          url: r.googleMapsUri ?? null,
        }))
        .filter((r) => r.text),
    };
  } catch (error) {
    console.error("[reviews] Google Places request failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Live Google rating and reviews for an office (Google returns up to five).
 * Returns null, and the reviews block stays hidden, until GOOGLE_PLACES_API_KEY
 * is set in Netlify. Reviews are shown exactly as Google returns them.
 */
export async function getPlaceReviews(office: { googlePlaceId?: string | null; mapQuery: string } | undefined) {
  if (!office || !process.env.GOOGLE_PLACES_API_KEY) return null;
  return loadReviews(office.googlePlaceId ?? null, office.mapQuery);
}
