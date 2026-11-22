"use server";

import { refresh } from "next/cache";
import { getActor } from "@/lib/portal/actor";
import { ALLOWED_TYPES, MAX_FILE_BYTES } from "@/lib/portal/journey";
import { deleteObject, objectKey, safeFileName, signedUploadUrl, storageConfigured, verifyUpload } from "@/lib/portal/storage";
import { createAdminClient } from "@/lib/supabase/admin";

type StartInput = {
  studentId: string;
  docType: string;
  label?: string;
  fileName: string;
  mime: string;
  size: number;
  serviceRequestId?: string | null;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Step 1 of an upload: record it as "uploading" (the database checks this person may
 * upload for this student) and return a signed link the browser sends the file to.
 */
export async function startUpload(input: StartInput): Promise<{ id: string; url: string } | { error: string }> {
  const actor = await getActor();
  if (!actor) return { error: "Please sign in again." };
  if (!storageConfigured()) return { error: "Document uploads aren't switched on yet. Please try again soon." };
  if (!uuid.test(input.studentId) || !/^[a-z0-9_]{2,40}$/.test(input.docType)) return { error: "Something went wrong. Please refresh the page." };
  if (!(ALLOWED_TYPES as readonly string[]).includes(input.mime)) return { error: "Please upload a PDF, JPG or PNG file." };
  if (!Number.isInteger(input.size) || input.size < 1 || input.size > MAX_FILE_BYTES) return { error: "Files can be up to 10 MB." };
  if (input.serviceRequestId && !uuid.test(input.serviceRequestId)) return { error: "Something went wrong. Please refresh the page." };

  const id = crypto.randomUUID();
  const fileName = safeFileName(input.fileName, input.mime);
  const key = objectKey(input.studentId, id, fileName);
  const { error } = await actor.supabase.from("documents").insert({
    id,
    student_id: input.studentId,
    doc_type: input.docType,
    label: input.docType === "other" || input.docType === "service" ? (input.label ?? "").trim().slice(0, 120) || "Document" : null,
    file_key: key,
    file_name: fileName,
    mime_type: input.mime,
    size_bytes: input.size,
    uploaded_by: actor.uid,
    service_request_id: input.serviceRequestId || null,
  });
  if (error) {
    if (error.code === "42501") return { error: "You can't upload for this student yet. Students under 18 need an approved parent first." };
    return { error: "Something went wrong. Please try again." };
  }
  return { id, url: await signedUploadUrl(key, input.mime, input.size) };
}

/**
 * Step 2: the browser says the file arrived. Check it really is the signed size and a real
 * PDF/JPG/PNG, then send it for review. Files that fail the check are deleted.
 */
export async function finishUpload(id: string, replaces?: string | null): Promise<{ ok: true } | { error: string }> {
  const actor = await getActor();
  if (!actor || !uuid.test(id)) return { error: "Please sign in again." };
  const { data: doc } = await actor.supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (!doc || doc.status !== "uploading" || doc.uploaded_by !== actor.uid) return { error: "Upload not found. Please try again." };

  const admin = createAdminClient();
  const check = await verifyUpload(doc.file_key, doc.mime_type, doc.size_bytes);
  if (!check.ok) {
    await deleteObject(doc.file_key).catch(() => {});
    await admin.from("documents").delete().eq("id", id);
    return { error: check.reason };
  }

  // Replacing an earlier file of the same kind for the same student
  let replaced: string | null = null;
  if (replaces && uuid.test(replaces)) {
    const { data: old } = await actor.supabase.from("documents").select("id, student_id, doc_type, status").eq("id", replaces).maybeSingle();
    if (old && old.student_id === doc.student_id && old.doc_type === doc.doc_type && !["uploading", "replaced"].includes(old.status)) {
      replaced = old.id;
    }
  }

  // Staff uploads (offer letters and the like) are approved straight away
  const { error } = await admin
    .from("documents")
    .update(
      actor.staff
        ? { status: "approved", reviewed_by: actor.uid, reviewed_at: new Date().toISOString(), replaces: replaced }
        : { status: "under_review", replaces: replaced },
    )
    .eq("id", id)
    .eq("status", "uploading");
  if (error) return { error: "Something went wrong. Please try again." };
  if (replaced) await admin.from("documents").update({ status: "replaced" }).eq("id", replaced);
  refresh();
  return { ok: true };
}

/** The browser couldn't send the file: forget the half-finished upload. */
export async function cancelUpload(id: string) {
  const actor = await getActor();
  if (!actor || !uuid.test(id)) return;
  const { data: doc } = await actor.supabase.from("documents").select("file_key, status, uploaded_by").eq("id", id).maybeSingle();
  if (!doc || doc.status !== "uploading" || doc.uploaded_by !== actor.uid) return;
  await deleteObject(doc.file_key).catch(() => {});
  await createAdminClient().from("documents").delete().eq("id", id).eq("status", "uploading");
}

/** Remove a file uploaded by mistake, while it is still waiting for review. */
export async function deleteDocument(form: FormData) {
  const actor = await getActor();
  const id = String(form.get("id") ?? "");
  if (!actor || !uuid.test(id)) return;
  const { data: doc } = await actor.supabase.from("documents").select("file_key, status, uploaded_by").eq("id", id).maybeSingle();
  if (!doc || doc.status !== "under_review" || doc.uploaded_by !== actor.uid) return;
  await deleteObject(doc.file_key).catch(() => {});
  await createAdminClient().from("documents").delete().eq("id", id).eq("status", "under_review");
  refresh();
}
