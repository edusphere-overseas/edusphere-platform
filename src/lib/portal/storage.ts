import "server-only";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ALLOWED_TYPES, MAX_FILE_BYTES } from "./journey";

/**
 * Private document storage in Cloudflare R2 (any S3-compatible store works locally).
 * Files are never public: uploads and downloads use signed links that expire in minutes.
 */

const bucket = () => process.env.R2_BUCKET ?? "";

export const storageConfigured = () =>
  Boolean(bucket() && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && (process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID));

let s3: S3Client | null = null;
function client() {
  if (!storageConfigured()) throw new Error("Document storage is not configured");
  s3 ??= new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
    // R2 rejects the extra checksum headers newer SDKs add to signed browser uploads
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return s3;
}

/** Letters, digits, dot, dash and underscore only; keeps the extension. */
export function safeFileName(name: string, mime: string) {
  const ext = mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : "jpg";
  const base = name
    .normalize("NFKD")
    .replace(/\.[^.]*$/, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return `${base || "document"}.${ext}`;
}

export const objectKey = (studentId: string, documentId: string, fileName: string) => `students/${studentId}/${documentId}/${fileName}`;

/** A link the browser uses to send one file, valid for 10 minutes. Type and size are part of the signature. */
export async function signedUploadUrl(key: string, mime: string, size: number) {
  return getSignedUrl(client(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: mime, ContentLength: size }), {
    expiresIn: 600,
    signableHeaders: new Set(["content-type", "content-length"]),
  });
}

/** A link to open or download one file, valid for 5 minutes. */
export async function signedDownloadUrl(key: string, fileName: string, mime: string, download = false) {
  const disposition = `${download ? "attachment" : "inline"}; filename="${fileName.replace(/"/g, "")}"`;
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: disposition, ResponseContentType: mime }),
    { expiresIn: 300 },
  );
}

const MAGIC: Record<(typeof ALLOWED_TYPES)[number], (b: Uint8Array) => boolean> = {
  "application/pdf": (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, // %PDF
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
};

/**
 * After the browser says the upload finished: the file must exist, match the size and
 * type that were signed, and really be a PDF, JPG or PNG (checked from its first bytes).
 */
export async function verifyUpload(key: string, mime: string, size: number): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const head = await client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    if (!head.ContentLength || head.ContentLength !== size || head.ContentLength > MAX_FILE_BYTES) {
      return { ok: false, reason: "The file size didn't match. Please try again." };
    }
    const part = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key, Range: "bytes=0-15" }));
    const bytes = new Uint8Array(await part.Body!.transformToByteArray());
    const check = MAGIC[mime as keyof typeof MAGIC];
    if (!check || !check(bytes)) return { ok: false, reason: "That file isn't a real PDF, JPG or PNG." };
    return { ok: true };
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "NotFound" || name === "NoSuchKey") return { ok: false, reason: "The upload didn't arrive. Please try again." };
    throw error;
  }
}

export async function deleteObject(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
