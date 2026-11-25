/** Upcoming study intakes ("September 2027"), for the apply and add-a-university forms. */
const MONTHS = ["January", "February", "May", "July", "September"];
const NUMBERS: Record<string, number> = { January: 0, February: 1, May: 4, July: 6, September: 8 };

export function intakeOptions(now = new Date(), count = 8) {
  const out: string[] = [];
  let year = now.getUTCFullYear();
  // An intake starting in the next two months is usually too close to apply for
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1));
  while (out.length < count) {
    for (const m of MONTHS) {
      if (Date.UTC(year, NUMBERS[m], 1) >= +from && out.length < count) out.push(`${m} ${year}`);
    }
    year += 1;
  }
  return out;
}

export const isIntake = (v: string) => v === "" || /^(January|February|May|July|September) 20\d\d$/.test(v);
