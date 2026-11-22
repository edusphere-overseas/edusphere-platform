/**
 * Consent wording shown at sign-up. Each acceptance is stored with this version and the date.
 * Change the version whenever the wording changes (Step 7 adds the privacy notice and terms;
 * have the wording checked by the lawyer reviewing them).
 */
export const CONSENT_VERSION = "2026-11-v1";

export const consentText = {
  student:
    "I agree to Edusphere Overseas using my personal details and documents to advise me and to share them with universities, visa authorities and service partners for my applications.",
  parent:
    "I agree to Edusphere Overseas using my personal details to provide its services to me and the student I link to.",
  guardian: "I confirm I am this student's parent or legal guardian.",
};
