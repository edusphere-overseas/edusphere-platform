import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { client } from "@/sanity/client";
import { SANITY_TAG } from "@/sanity/tags";

/** How recent a publish must be for the content area's refresh request to count. */
const RECENT_MS = 3 * 60 * 1000;

/** Latest publish already refreshed by this server instance, so repeat calls do nothing. */
let refreshedFor = "";

/**
 * Makes the website show newly published content straight away, instead of within the
 * usual minute or two. Two callers:
 *
 * 1. The content area (Sanity Studio at /admin/content) after each Publish. This needs no
 *    secret: the server asks Sanity itself whether something was published in the last few
 *    minutes and only then refreshes, so calling it at other times does nothing.
 * 2. Optionally a Sanity webhook, signed with SANITY_REVALIDATE_SECRET (set in Vercel and on
 *    the webhook). This also covers deletes and changes made outside the content area.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (secret && req.headers.has("sanity-webhook-signature")) {
    const { isValidSignature, body } = await parseBody<{ _type?: string }>(req, secret);
    if (!isValidSignature) return new Response("Invalid signature", { status: 401 });
    revalidateTag(SANITY_TAG, { expire: 0 });
    return Response.json({ revalidated: true, type: body?._type ?? null });
  }

  let latest: string | null = null;
  try {
    latest = await client.fetch<string | null>(
      `*[!(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(_updatedAt desc)[0]._updatedAt`,
      {},
      { cache: "no-store" },
    );
  } catch (error) {
    console.error("[revalidate] couldn't reach Sanity:", error instanceof Error ? error.message : error);
    return Response.json({ revalidated: false }, { status: 502 });
  }

  const publishedAt = latest ? Date.parse(latest) : NaN;
  if (!latest || !(Date.now() - publishedAt < RECENT_MS)) return Response.json({ revalidated: false });
  if (latest !== refreshedFor) {
    refreshedFor = latest;
    revalidateTag(SANITY_TAG, { expire: 0 });
  }
  return Response.json({ revalidated: true, publishedAt: latest });
}
