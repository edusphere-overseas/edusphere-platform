"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { sendMessage, type MessageState } from "@/app/portal/_actions/messages";
import { FormError, SubmitButton } from "./FormBits";
import { input } from "./ui";

export function Composer({ studentId, requestId, placeholder = "Write a message…" }: { studentId: string; requestId?: string; placeholder?: string }) {
  const [state, action] = useActionState<MessageState, FormData>(sendMessage, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.sent) form.current?.reset();
  }, [state?.sent]);

  return (
    <form ref={form} action={action} className="grid gap-2">
      <input type="hidden" name="student" value={studentId} />
      {requestId && <input type="hidden" name="request" value={requestId} />}
      <label htmlFor={`msg-${requestId ?? "general"}`} className="sr-only">
        Message
      </label>
      <textarea id={`msg-${requestId ?? "general"}`} name="body" required rows={3} maxLength={4000} placeholder={placeholder} className={`${input} resize-y`} />
      <FormError message={state?.error} />
      <div className="flex justify-end">
        <SubmitButton pending="Sending…">
          <Send className="h-4 w-4" aria-hidden="true" />
          Send
        </SubmitButton>
      </div>
    </form>
  );
}
