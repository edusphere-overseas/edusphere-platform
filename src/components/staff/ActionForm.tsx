"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { ActionState } from "@/app/staff/_actions";
import { FormError } from "@/components/portal/FormBits";
import { btnPrimary } from "@/components/portal/ui";

type Props = {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  /** clear the fields after a successful save (forms that add something new) */
  clearOnSave?: boolean;
};

const Pending = createContext(false);

/**
 * A staff form that shows the result of its server action underneath. It submits by hand
 * rather than through the form's action, so what was typed stays put when a save fails.
 */
export function ActionForm({ action, children, className = "", clearOnSave }: Props) {
  const [state, run, pending] = useActionState(action, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (clearOnSave && state?.ok) form.current?.reset();
  }, [state, clearOnSave]);

  return (
    <form
      ref={form}
      className={className}
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => run(data));
      }}
    >
      <Pending value={pending}>{children}</Pending>
      {state?.error && (
        <div className="basis-full [grid-column:1/-1]">
          <FormError message={state.error} />
        </div>
      )}
      {state?.ok && !pending && (
        <p role="status" className="flex basis-full items-center gap-1.5 text-sm font-semibold text-[#17663a] [grid-column:1/-1]">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {state.ok}
        </p>
      )}
    </form>
  );
}

/** The submit button of an ActionForm, with a spinner while it saves. */
export function Submit({ children, className = btnPrimary, pending: pendingLabel }: { children: React.ReactNode; className?: string; pending?: string }) {
  const pending = useContext(Pending);
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
