/** Sanity project settings. The project ID is not secret; env vars can override it. */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "wuskruh6";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2026-11-01";
export const studioBasePath = "/admin/content";
