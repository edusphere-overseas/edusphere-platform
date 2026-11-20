import { cacheLife, cacheTag } from "next/cache";
import { client } from "./client";
import { SANITY_TAG } from "./tags";

/**
 * Cached Sanity query. Results are shared by every visitor and refreshed about
 * once a minute, or immediately when the Sanity webhook calls /api/revalidate.
 * Returns null if Sanity can't be reached, so the site falls back to defaults.
 */
export async function sanityQuery<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
  "use cache";
  cacheTag(SANITY_TAG);
  cacheLife("minutes");
  try {
    return await client.fetch<T>(query, params);
  } catch (error) {
    console.error("[sanity] query failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
