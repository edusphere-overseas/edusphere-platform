/**
 * Application stages and the document checklist.
 */

export const STAGES = [
  { key: "counselling", label: "Counselling" },
  { key: "shortlist", label: "Shortlist" },
  { key: "applied", label: "Applied" },
  { key: "offer", label: "Offer" },
  { key: "deposit", label: "Deposit" },
  { key: "cas", label: "CAS / CoE / I-20" },
  { key: "visa_filed", label: "Visa filed" },
  { key: "visa_granted", label: "Visa granted" },
  { key: "pre_departure", label: "Pre-departure" },
] as const;

const confirmationName: Record<string, string> = {
  uk: "CAS",
  australia: "CoE",
  usa: "I-20",
  canada: "Letter of acceptance",
  europe: "Admission letter",
};

/** "CAS" for the UK, "CoE" for Australia, "I-20" for the US… */
export function stageLabel(stage: string, country?: string | null) {
  if (stage === "cas" && country && confirmationName[country]) return confirmationName[country];
  return STAGES.find((s) => s.key === stage)?.label ?? stage;
}

export const stageIndex = (stage: string) => STAGES.findIndex((s) => s.key === stage);

export const DESTINATIONS: { id: string; name: string; flag: string }[] = [
  { id: "uk", name: "United Kingdom", flag: "gb" },
  { id: "australia", name: "Australia", flag: "au" },
  { id: "canada", name: "Canada", flag: "ca" },
  { id: "usa", name: "United States", flag: "us" },
  { id: "new-zealand", name: "New Zealand", flag: "nz" },
  { id: "europe", name: "Europe", flag: "eu" },
];
export const destinationName = (id?: string | null) => DESTINATIONS.find((d) => d.id === id)?.name ?? id ?? "";

// ---------------------------------------------------------------------
// Document checklist
// ---------------------------------------------------------------------

export type DocGroup = "identity" | "academic" | "english" | "application" | "finance" | "university" | "visa" | "other";

export const GROUP_TITLES: Record<DocGroup, string> = {
  identity: "Identity",
  academic: "Academic records",
  english: "English test",
  application: "Application documents",
  finance: "Finances",
  university: "From your university",
  visa: "Visa",
  other: "Other documents",
};

export type ChecklistItem = {
  key: string;
  label: string;
  hint: string;
  group: DocGroup;
  required: boolean; // false: "if it applies to you"
  multiple?: boolean;
};

export type DocStatus = "missing" | "under_review" | "approved" | "reupload";

export const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  missing: "Not uploaded",
  under_review: "Under review",
  approved: "Approved",
  reupload: "Re-upload needed",
};

type ChecklistInput = { countries: string[]; level?: string | null };

/** The checklist for a student, generated from their destinations (and study level). */
export function buildChecklist({ countries, level }: ChecklistInput): ChecklistItem[] {
  const pg = !!level && /post|master|phd|doctor|mba/i.test(level);
  const has = (c: string) => countries.includes(c);
  const confirmations = countries.map((c) => confirmationName[c]).filter(Boolean);

  const items: ChecklistItem[] = [
    { key: "passport", label: "Passport", hint: "The pages with your photo and personal details, and the last page.", group: "identity", required: true },
    { key: "marksheet_10", label: "10th marksheet", hint: "SSLC or equivalent.", group: "academic", required: true },
    { key: "marksheet_12", label: "12th marksheet", hint: "PUC, HSC or equivalent.", group: "academic", required: true },
    {
      key: "degree",
      label: "Degree marksheets and certificate",
      hint: "Every semester's marksheet, plus the provisional or final certificate.",
      group: "academic",
      required: pg,
      multiple: true,
    },
    { key: "english_test", label: "IELTS, PTE or TOEFL score report", hint: "Upload it once you have your score.", group: "english", required: true },
    { key: "sop", label: "Statement of purpose (SOP)", hint: "Your latest draft; your counsellor will review it.", group: "application", required: true },
    { key: "lor", label: "Letters of recommendation", hint: "Usually two, from teachers or employers.", group: "application", required: true, multiple: true },
    { key: "cv", label: "CV or résumé", hint: "One or two pages.", group: "application", required: true },
    { key: "work_letters", label: "Work experience letters", hint: "If you have worked: letters from each employer.", group: "application", required: false, multiple: true },
    { key: "bank_statements", label: "Bank statements", hint: "Recent statements showing the funds for your studies.", group: "finance", required: true, multiple: true },
    { key: "loan_letter", label: "Education loan sanction letter", hint: "If you are funding your studies with a loan.", group: "finance", required: false },
    { key: "offer_letter", label: "Offer letter", hint: "From each university that makes you an offer.", group: "university", required: false, multiple: true },
  ];

  if (confirmations.length || countries.length === 0) {
    items.push({
      key: "confirmation",
      label: confirmations.length ? [...new Set(confirmations)].join(" / ") : "CAS / CoE / I-20",
      hint: "Issued by your university once you accept an offer and pay the deposit.",
      group: "university",
      required: false,
    });
  }

  if (has("uk")) items.push({ key: "tb_test", label: "TB test certificate (UK)", hint: "From a clinic approved by the UK Home Office.", group: "visa", required: false });
  if (has("australia")) {
    items.push({ key: "oshc", label: "Overseas Student Health Cover (Australia)", hint: "Your OSHC policy certificate.", group: "visa", required: false });
    items.push({ key: "gs_statement", label: "Genuine Student answers (Australia)", hint: "Your draft answers for the Genuine Student requirement.", group: "visa", required: false });
  }
  if (has("usa")) {
    items.push({ key: "ds160", label: "DS-160 confirmation (US)", hint: "The confirmation page after you submit the DS-160.", group: "visa", required: false });
    items.push({ key: "sevis_fee", label: "SEVIS fee receipt (US)", hint: "The I-901 SEVIS fee payment receipt.", group: "visa", required: false });
  }
  if (has("canada")) items.push({ key: "pal", label: "Provincial attestation letter (Canada)", hint: "If your programme needs one; your university helps you get it.", group: "visa", required: false });
  if (has("new-zealand")) items.push({ key: "medical", label: "Medical and chest X-ray certificates (New Zealand)", hint: "If required for your visa.", group: "visa", required: false });
  items.push({ key: "visa_forms", label: "Visa application forms", hint: "Completed forms and any confirmation pages.", group: "visa", required: false, multiple: true });

  return items;
}

export const OTHER_DOC: ChecklistItem = {
  key: "other",
  label: "Other document",
  hint: "Anything else your counsellor asked for.",
  group: "other",
  required: false,
  multiple: true,
};

export function itemStatus(files: { status: string }[]): DocStatus {
  const live = files.filter((f) => f.status !== "uploading" && f.status !== "replaced");
  if (!live.length) return "missing";
  if (live.some((f) => f.status === "reupload")) return "reupload";
  if (live.some((f) => f.status === "under_review")) return "under_review";
  return "approved";
}

export function checklistLabel(key: string, countries: string[], label?: string | null) {
  if (key === "other") return label || "Other document";
  return [...buildChecklist({ countries, level: "postgraduate" }), OTHER_DOC].find((i) => i.key === key)?.label ?? key;
}

export const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Profile choices
export const LEVELS = ["Foundation or diploma", "Undergraduate", "Postgraduate", "MBA", "PhD"];
export const FUNDING = ["Family savings", "Education loan", "Scholarship", "Sponsor or employer", "A mix of these", "Not sure yet"];
export const TESTS = ["IELTS", "PTE", "TOEFL", "Duolingo", "GRE", "GMAT", "SAT", "Other"];
