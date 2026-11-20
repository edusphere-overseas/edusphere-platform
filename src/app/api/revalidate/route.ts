import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { SANITY_TAG } from "@/sanity/tags";

/**
 * Called by a Sanity webhook whenever content is published, so the website
 * updates straight away instead of within the usual minute.
 * Requires SANITY_REVALIDATE_SECRET in Netlify and the same secret on the webhook.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return new Response("Revalidation is not configured", { status: 501 });

  const { isValidSignature, body } = await parseBody<{ _type?: string }>(req, secret);
  if (!isValidSignature) return new Response("Invalid signature", { status: 401 });

  revalidateTag(SANITY_TAG, { expire: 0 });
  return Response.json({ revalidated: true, type: body?._type ?? null });
}
