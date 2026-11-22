/**
 * Student services that can be requested in the portal.
 * Each has its own form, status steps and (in the admin dashboard) an owner.
 * Switches and prices live in Content → Website settings → Portal services.
 */

export type ServiceKey = "airport_pickup" | "accommodation" | "post_study_work_visa" | "scholarship" | "uk_onshore";

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "time" | "number" | "select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  hint?: string;
  max?: number; // characters, or the highest number
  min?: number;
};

export type ServiceDef = {
  key: ServiceKey;
  settingsKey: "airportPickup" | "accommodation" | "postStudyWorkVisa" | "scholarship" | "ukOnshore";
  title: string;
  summary: string;
  icon: "plane" | "home" | "briefcase" | "award" | "landmark";
  weDo: string;
  steps: { key: string; label: string }[];
  fields: Field[];
  /** one line describing the request in lists */
  describe: (d: Record<string, string>) => string;
};

const destinationOptions = ["United Kingdom", "Australia", "Canada", "United States", "New Zealand", "Ireland", "Europe (other)"];

export const services: ServiceDef[] = [
  {
    key: "airport_pickup",
    settingsKey: "airportPickup",
    title: "Airport pickup and drop",
    summary: "A trusted driver meets you on arrival, or takes you to the airport.",
    icon: "plane",
    weDo: "We arrange the pickup or drop with a trusted partner and send you the driver and meeting-point details.",
    steps: [
      { key: "requested", label: "Requested" },
      { key: "confirmed", label: "Confirmed" },
      { key: "details_sent", label: "Details sent" },
      { key: "completed", label: "Completed" },
    ],
    fields: [
      { name: "direction", label: "What do you need?", type: "select", required: true, options: ["Pickup when I arrive", "Drop for my departure", "Both"] },
      { name: "airport", label: "Airport", type: "text", required: true, placeholder: "For example London Heathrow (LHR)", max: 120 },
      { name: "flight", label: "Flight number", type: "text", required: true, placeholder: "For example AI 161", max: 20 },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "time", label: "Landing or departure time (local)", type: "time", required: true },
      { name: "passengers", label: "Passengers", type: "number", required: true, min: 1, max: 8 },
      { name: "luggage", label: "Luggage", type: "text", required: true, placeholder: "For example 2 large suitcases and a backpack", max: 120 },
      { name: "address", label: "Destination or pickup address", type: "textarea", required: true, placeholder: "Accommodation name and full address", max: 400 },
      { name: "notes", label: "Anything else?", type: "textarea", max: 600 },
    ],
    describe: (d) => [d.direction, d.airport, d.date].filter(Boolean).join(" · "),
  },
  {
    key: "accommodation",
    settingsKey: "accommodation",
    title: "Accommodation abroad",
    summary: "Student halls or private rooms near your university, shortlisted for you.",
    icon: "home",
    weDo: "We shortlist student halls or private options and help with booking and paperwork.",
    steps: [
      { key: "requested", label: "Requested" },
      { key: "options_sent", label: "Options sent" },
      { key: "booked", label: "Booked" },
      { key: "completed", label: "Completed" },
    ],
    fields: [
      { name: "city", label: "City", type: "text", required: true, max: 80 },
      { name: "university", label: "University", type: "text", required: true, max: 160 },
      { name: "moveIn", label: "Move-in date", type: "date", required: true },
      { name: "budget", label: "Budget", type: "text", required: true, placeholder: "For example £180 a week", max: 60 },
      { name: "roomType", label: "Room type", type: "select", required: true, options: ["Shared room", "Private room", "En-suite room", "Studio", "Homestay", "Not sure yet"] },
      { name: "preferences", label: "Preferences", type: "textarea", placeholder: "Food, distance to campus, sharing with friends…", max: 600 },
    ],
    describe: (d) => [d.city, d.university, d.moveIn && `from ${d.moveIn}`].filter(Boolean).join(" · "),
  },
  {
    key: "post_study_work_visa",
    settingsKey: "postStudyWorkVisa",
    title: "Post-study work visa",
    summary: "Help to check eligibility and prepare your post-study work visa application.",
    icon: "briefcase",
    weDo: "We check eligibility from official guidance, prepare your application checklist and review your application.",
    steps: [
      { key: "requested", label: "Requested" },
      { key: "eligibility_checked", label: "Eligibility checked" },
      { key: "documents_ready", label: "Documents ready" },
      { key: "submitted", label: "Submitted" },
      { key: "decision", label: "Decision" },
    ],
    fields: [
      { name: "country", label: "Country you're studying in", type: "select", required: true, options: destinationOptions },
      { name: "currentVisa", label: "Current visa", type: "text", required: true, placeholder: "For example Student visa", max: 80 },
      { name: "visaExpiry", label: "Visa expiry date", type: "date", required: true },
      { name: "courseEnd", label: "Course end date", type: "date", required: true },
      { name: "notes", label: "Anything else?", type: "textarea", max: 600 },
    ],
    describe: (d) => [d.country, d.courseEnd && `course ends ${d.courseEnd}`].filter(Boolean).join(" · "),
  },
  {
    key: "scholarship",
    settingsKey: "scholarship",
    title: "Scholarship assistance",
    summary: "Scholarships matched to your profile, with deadlines planned and essays reviewed.",
    icon: "award",
    weDo: "We match scholarships to your profile, plan the deadlines and review your essays.",
    steps: [
      { key: "requested", label: "Requested" },
      { key: "shortlist_sent", label: "Shortlist sent" },
      { key: "applied", label: "Applied" },
      { key: "result", label: "Result" },
    ],
    fields: [
      { name: "universities", label: "Target universities", type: "textarea", required: true, max: 600 },
      { name: "intake", label: "Intake", type: "text", required: true, placeholder: "For example September 2027", max: 40 },
      { name: "awards", label: "Past awards or achievements", type: "textarea", max: 800 },
      { name: "notes", label: "Anything else?", type: "textarea", max: 600 },
    ],
    describe: (d) => [d.intake].filter(Boolean).join(" · "),
  },
  {
    key: "uk_onshore",
    settingsKey: "ukOnshore",
    title: "UK onshore admission and Graduate visa",
    summary: "Already in the UK? Admission to a further course, with help on your Graduate visa application.",
    icon: "landmark",
    weDo: "Our London team checks your options, helps with admission and supports your Graduate visa application.",
    steps: [
      { key: "requested", label: "Requested" },
      { key: "eligibility_checked", label: "Eligibility checked" },
      { key: "admission_applied", label: "Admission applied" },
      { key: "visa_submitted", label: "Visa submitted" },
      { key: "decision", label: "Decision" },
    ],
    fields: [
      { name: "currentVisa", label: "Current visa", type: "text", required: true, placeholder: "For example Student visa", max: 80 },
      { name: "visaExpiry", label: "Visa expiry date", type: "date", required: true },
      { name: "courseEnd", label: "Current course end date", type: "date", required: true },
      { name: "intendedCourse", label: "Course you'd like to study next", type: "text", required: true, max: 160 },
      { name: "notes", label: "Anything else?", type: "textarea", max: 600 },
    ],
    describe: (d) => [d.intendedCourse, d.courseEnd && `course ends ${d.courseEnd}`].filter(Boolean).join(" · "),
  },
];

export const serviceByKey = (key: string) => services.find((s) => s.key === key);

export const FINAL_STATUSES = ["completed", "decision", "result", "cancelled"];

export function statusLabel(service: string, status: string) {
  if (status === "cancelled") return "Cancelled";
  return serviceByKey(service)?.steps.find((s) => s.key === status)?.label ?? status;
}

export type PortalServiceSetting = { show: boolean; price: string; includes: string[] };
export type PortalServiceSettings = Record<ServiceDef["settingsKey"], PortalServiceSetting>;

export const defaultPortalServices: PortalServiceSettings = {
  airportPickup: { show: true, price: "", includes: [] },
  accommodation: { show: true, price: "", includes: [] },
  postStudyWorkVisa: { show: true, price: "", includes: [] },
  scholarship: { show: true, price: "", includes: [] },
  // UK immigration advice needs an IAA-regulated adviser: off until the London office is ready
  ukOnshore: { show: false, price: "", includes: [] },
};

/** Check a submitted form against the service's fields. Returns clean values or errors. */
export function validateServiceForm(def: ServiceDef, input: Record<string, string>) {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  for (const f of def.fields) {
    const raw = (input[f.name] ?? "").trim();
    if (!raw) {
      if (f.required) errors[f.name] = f.type === "select" ? "Please choose one" : "Please fill this in";
      continue;
    }
    if (f.type === "select" && f.options && !f.options.includes(raw)) {
      errors[f.name] = "Please choose an option";
    } else if (f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      errors[f.name] = "Please enter a date";
    } else if (f.type === "time" && !/^\d{2}:\d{2}$/.test(raw)) {
      errors[f.name] = "Please enter a time";
    } else if (f.type === "number") {
      const n = Number(raw);
      if (!Number.isInteger(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) {
        errors[f.name] = `Please enter a number from ${f.min ?? 0} to ${f.max ?? 99}`;
      }
    } else if (raw.length > (f.max ?? 400)) {
      errors[f.name] = `Please keep this under ${f.max ?? 400} characters`;
    }
    values[f.name] = raw;
  }
  return { values, errors, ok: Object.keys(errors).length === 0 };
}
