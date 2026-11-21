const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
  timeZoneName: "short",
});

/** "20 November 2026" */
export const formatDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : "");

/** "Fri, 20 Nov, 4:30 pm IST" */
export const formatDateTime = (iso?: string | null) => (iso ? dateTimeFmt.format(new Date(iso)) : "");

/** "the UK" / "the USA" / "Canada", for sentences. */
export const shortName = (n: string) => (n === "United Kingdom" ? "the UK" : n === "United States" ? "the USA" : n);
