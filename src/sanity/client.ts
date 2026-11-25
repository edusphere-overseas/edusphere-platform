import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/**
 * Read-only client for published content (the dataset is public; no token needed).
 * It reads Sanity's live API rather than its CDN so a page rebuilt straight after
 * Publish gets the new content; the site's own cache keeps the number of reads small.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
});
