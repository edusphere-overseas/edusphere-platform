import { NextResponse, type NextRequest } from "next/server";
import { logActivity } from "@/lib/portal/actor";
import { signedDownloadUrl, storageConfigured } from "@/lib/portal/storage";
import { portalConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Open a document: checks access (database rules), records the view in the activity log,
 * then sends the browser to a private link that expires after 5 minutes.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/portal/files/[id]">) {
  const { id } = await params;
  if (!portalConfigured) return NextResponse.redirect(new URL("/portal", request.url));
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return NextResponse.redirect(new URL("/sign-in", request.url));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !storageConfigured()) return new NextResponse("Not found", { status: 404 });

  const { data: doc } = await supabase.from("documents").select("id, student_id, file_key, file_name, mime_type, status").eq("id", id).maybeSingle();
  if (!doc || doc.status === "uploading") return new NextResponse("Not found", { status: 404 });

  const download = request.nextUrl.searchParams.get("download") === "1";
  await logActivity(uid, doc.student_id, download ? "document_downloaded" : "document_viewed", "document", doc.id, { file: doc.file_name });
  const url = await signedDownloadUrl(doc.file_key, doc.file_name, doc.mime_type, download);
  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
