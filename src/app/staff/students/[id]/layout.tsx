import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { Pill } from "@/components/portal/ui";
import { StudentTabs } from "@/components/staff/StaffNav";
import { ageFrom, displayName, officeLabel, OFFICES } from "@/lib/staff/context";
import { getStudent } from "@/lib/staff/student";

const whatsapp = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return `https://wa.me/${d.length === 10 ? `91${d}` : d.replace(/^0+/, "")}`;
};

export default async function StudentLayout({ children, params }: LayoutProps<"/staff/students/[id]">) {
  const { id } = await params;
  const { s, student, details, name } = await getStudent(id);
  const [docs, requests, counsellor] = await Promise.all([
    s.supabase.from("documents").select("id", { count: "exact", head: true }).eq("student_id", id).eq("status", "under_review"),
    s.supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("student_id", id).eq("status", "requested"),
    details.counsellor_id ? s.supabase.from("profiles").select("full_name, email").eq("id", details.counsellor_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const age = ageFrom(details.date_of_birth);

  return (
    <>
      <Link href="/staff/students" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-deep">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Students
      </Link>
      <div className="mt-4 mb-5 flex flex-wrap items-start gap-4">
        <span className="grid grid-cols-1 h-14 w-14 shrink-0 place-items-center rounded-2xl bg-teal/12 text-xl font-extrabold text-navy">{name.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-deep sm:text-3xl">{name}</h1>
            {age !== null && age < 18 && <Pill tone="amber">Under 18</Pill>}
            {!student.onboarded_at && <Pill>Sign-up unfinished</Pill>}
          </div>
          <p className="mt-1 text-sm text-slate">
            {[age !== null ? `${age} years old` : null, details.city, OFFICES.length > 1 ? officeLabel(details.office) : null].filter(Boolean).join(" · ")}
            {age !== null || details.city ? " · " : ""}
            Counsellor:{" "}
            {counsellor.data ? <strong className="text-deep">{displayName(counsellor.data)}</strong> : <strong className="text-[#9a5b00]">not assigned yet</strong>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {student.phone && (
              <>
                <a href={`tel:${student.phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-deep ring-1 ring-deep/12 hover:bg-mist">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {student.phone}
                </a>
                <a href={whatsapp(student.phone)} target="_blank" rel="noopener" className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-[#17663a] ring-1 ring-[#17663a]/25 hover:bg-[#e7f6ee]">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  WhatsApp
                </a>
              </>
            )}
            <a href={`mailto:${student.email}`} className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-deep ring-1 ring-deep/12 hover:bg-mist">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{student.email}</span>
            </a>
          </div>
        </div>
      </div>
      <StudentTabs id={id} counts={{ documents: docs.count ?? 0, services: requests.count ?? 0 }} />
      {children}
    </>
  );
}
