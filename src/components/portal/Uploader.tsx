"use client";

import { useId, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, Upload } from "lucide-react";
import { cancelUpload, finishUpload, startUpload } from "@/app/portal/_actions/documents";
import { ALLOWED_TYPES, MAX_FILE_BYTES } from "@/lib/portal/journey";
import { btnGhost, btnPrimary, input } from "./ui";

type Props = {
  studentId: string;
  docType: string;
  replaces?: string;
  serviceRequestId?: string;
  askLabel?: boolean;
  text?: string;
  primary?: boolean;
};

type Phase = { step: "idle" } | { step: "sending"; pct: number } | { step: "checking" } | { step: "done" } | { step: "error"; message: string };

const SHRINK_OVER = 3 * 1024 * 1024; // photos larger than this are resized before sending
const MAX_SIDE = 2400;

/** Large phone photos become a sharp JPEG of at most 2400 px: quicker on mobile data, still easy to read. */
async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function send(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`status ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

export function Uploader({ studentId, docType, replaces, serviceRequestId, askLabel, text = "Upload", primary = true }: Props) {
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [label, setLabel] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const id = useId();
  const busy = phase.step === "sending" || phase.step === "checking";

  async function handle(original: File | undefined) {
    if (!original) return;
    if (askLabel && !label.trim()) {
      setPhase({ step: "error", message: "Please say what this document is first." });
      return;
    }
    let file = original;
    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      setPhase({ step: "error", message: "Please choose a PDF, JPG or PNG file." });
      return;
    }
    if (file.type !== "application/pdf" && file.size > SHRINK_OVER) file = await shrinkPhoto(file);
    if (file.size > MAX_FILE_BYTES) {
      setPhase({ step: "error", message: "That file is over 10 MB. Please choose a smaller file or scan at a lower resolution." });
      return;
    }

    setPhase({ step: "sending", pct: 0 });
    const start = await startUpload({ studentId, docType, label, fileName: file.name, mime: file.type, size: file.size, serviceRequestId });
    if ("error" in start) {
      setPhase({ step: "error", message: start.error });
      return;
    }
    try {
      await send(start.url, file, (pct) => setPhase({ step: "sending", pct }));
    } catch {
      await cancelUpload(start.id);
      setPhase({ step: "error", message: "The upload didn't finish. Check your connection and try again." });
      return;
    }
    setPhase({ step: "checking" });
    const done = await finishUpload(start.id, replaces);
    if ("error" in done) {
      setPhase({ step: "error", message: done.error });
      return;
    }
    setLabel("");
    setPhase({ step: "done" });
    setTimeout(() => setPhase((p) => (p.step === "done" ? { step: "idle" } : p)), 3000);
  }

  return (
    <div className="grid gap-2">
      {askLabel && (
        <label className="grid gap-1 text-xs font-semibold text-slate">
          What is this document?
          <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} placeholder="For example Gap year letter" className={`${input} py-2.5`} />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          id={`${id}-file`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            void handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            void handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className={`${primary ? btnPrimary : btnGhost} min-h-10 py-2`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          {phase.step === "sending" ? `Sending ${phase.pct}%` : phase.step === "checking" ? "Checking…" : text}
        </button>
        <button type="button" disabled={busy} onClick={() => cameraInput.current?.click()} className={`${btnGhost} min-h-10 py-2 sm:hidden`}>
          <Camera className="h-4 w-4" aria-hidden="true" />
          Take photo
        </button>
      </div>
      {phase.step === "sending" && (
        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-mist" aria-hidden="true">
          <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${phase.pct}%` }} />
        </div>
      )}
      <p aria-live="polite" className="text-sm">
        {phase.step === "done" && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#17663a]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Uploaded. Your counsellor will review it.
          </span>
        )}
        {phase.step === "error" && <span className="font-medium text-[#b42318]">{phase.message}</span>}
      </p>
    </div>
  );
}
