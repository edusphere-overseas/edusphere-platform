import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/** Read-only client for published content (the dataset is public; no token needed). */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});
