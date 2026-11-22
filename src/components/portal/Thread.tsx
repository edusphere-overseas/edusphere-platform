import type { Portal } from "@/lib/portal/context";
import { Composer } from "./Composer";
import { formatDate } from "./ui";

/** A message thread: the general one with the counsellor, or one per service request. */
export async function Thread({ p, studentId, requestId, empty, placeholder }: { p: Pick<Portal, "supabase" | "userId">; studentId: string; requestId?: string; empty: string; placeholder?: string }) {
  let q = p.supabase.from("messages").select("id, body, sender_id, sender_name, sender_role, created_at").eq("student_id", studentId);
  q = requestId ? q.eq("service_request_id", requestId) : q.is("service_request_id", null);
  const { data: messages } = await q.order("created_at", { ascending: true }).limit(200);

  return (
    <div>
      {messages?.length ? (
        <ol className="mb-5 grid gap-3">
          {messages.map((m) => {
            const mine = m.sender_id === p.userId;
            const staff = ["counsellor", "admin", "editor"].includes(m.sender_role ?? "");
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${mine ? "rounded-br-md bg-teal text-white" : staff ? "rounded-bl-md bg-deep text-white" : "rounded-bl-md bg-mist text-deep"}`}>
                  <p className={`text-xs font-bold ${mine ? "text-white/80" : staff ? "text-teal-light" : "text-slate"}`}>
                    {mine ? "You" : (m.sender_name ?? "Edusphere team")} · {formatDate(m.created_at, true)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed">{m.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mb-5 text-sm text-slate">{empty}</p>
      )}
      <Composer studentId={studentId} requestId={requestId} placeholder={placeholder} />
    </div>
  );
}
