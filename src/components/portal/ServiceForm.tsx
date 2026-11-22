"use client";

import { useActionState, useState } from "react";
import { requestService, type ServiceFormState } from "@/app/portal/_actions/services";
import { serviceByKey, type PortalServiceSetting, type ServiceKey } from "@/lib/portal/services";
import { FormError, SubmitButton } from "./FormBits";
import { hint, input, label } from "./ui";

export function ServiceForm({ service, studentId, setting }: { service: ServiceKey; studentId: string; setting: PortalServiceSetting }) {
  const def = serviceByKey(service)!;
  const [state, action] = useActionState<ServiceFormState, FormData>(requestService, null);
  // a field's error disappears as soon as it's changed
  const [fixed, setFixed] = useState<{ for: ServiceFormState; names: string[] }>({ for: null, names: [] });
  const cleared = fixed.for === state ? fixed.names : [];
  const markFixed = (name: string) => setFixed({ for: state, names: [...cleared, name] });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="service" value={service} />
      <input type="hidden" name="student" value={studentId} />
      <div className="grid gap-4 sm:grid-cols-2">
        {def.fields.map((f) => {
          const err = cleared.includes(f.name) ? undefined : state?.fieldErrors?.[f.name];
          const common = {
            name: f.name,
            id: `f-${f.name}`,
            required: f.required,
            defaultValue: state?.values?.[f.name] ?? "",
            onInput: () => err && markFixed(f.name),
            "aria-invalid": err ? true : undefined,
            "aria-describedby": err ? `e-${f.name}` : undefined,
            className: `${input} ${err ? "border-[#b42318] ring-3 ring-[#b42318]/15" : ""}`,
          };
          const wide = f.type === "textarea" || f.type === "select";
          return (
            <div key={f.name} className={`${label} ${wide ? "sm:col-span-2" : ""}`}>
              <label htmlFor={`f-${f.name}`}>
                {f.label}
                {!f.required && <span className="font-normal text-slate"> (optional)</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea {...common} rows={3} maxLength={f.max} placeholder={f.placeholder} />
              ) : f.type === "select" ? (
                <select {...common}>
                  <option value="">Choose…</option>
                  {f.options!.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  {...common}
                  type={f.type}
                  placeholder={f.placeholder}
                  maxLength={f.type === "text" ? f.max : undefined}
                  min={f.type === "number" ? f.min : f.type === "date" && /date|moveIn/.test(f.name) ? today : undefined}
                  max={f.type === "number" ? f.max : undefined}
                  inputMode={f.type === "number" ? "numeric" : undefined}
                />
              )}
              {f.hint && <span className={hint}>{f.hint}</span>}
              {err && (
                <span id={`e-${f.name}`} className="text-xs font-semibold text-[#b42318]">
                  {err}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {(setting.price || setting.includes.length > 0) && (
        <div className="rounded-2xl bg-mist p-4 text-sm">
          {setting.price && (
            <p className="font-bold text-deep">
              Price: <span className="text-lg">{setting.price}</span>
            </p>
          )}
          {setting.includes.length > 0 && (
            <>
              <p className="mt-2 font-semibold text-deep">What&apos;s included</p>
              <ul className="mt-1 list-disc pl-5 text-slate">
                {setting.includes.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </>
          )}
          {setting.price && (
            <>
              <p className="mt-3 text-slate">Our team confirms payment with you directly; there&apos;s nothing to pay online.</p>
              <label className="mt-3 flex items-start gap-3 text-slate">
                <input name="accept_price" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-teal" />
                <span>I&apos;ve seen the price and want to go ahead.</span>
              </label>
            </>
          )}
        </div>
      )}

      <FormError message={state?.error} />
      <div>
        <SubmitButton pending="Sending…">Send request</SubmitButton>
      </div>
    </form>
  );
}
