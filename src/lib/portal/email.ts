import "server-only";
import { appendFile } from "node:fs/promises";
import { Resend } from "resend";
import { siteOrigin } from "@/lib/supabase/env";

/**
 * Portal emails, sent with Resend. Until RESEND_API_KEY and EMAIL_FROM are set they are
 * only written to the server log, so nothing breaks before the domain is verified.
 * (Sign-up verification and password reset emails are sent by Supabase itself.)
 */

type Email = {
  to: string | string[];
  subject: string;
  heading: string;
  lines: string[];
  button?: { label: string; path: string };
  replyTo?: string;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderEmail({ heading, lines, button }: Email) {
  const url = button ? `${siteOrigin()}${button.path}` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f7fa;font-family:Montserrat,Segoe UI,Arial,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0d2236;padding:20px 28px;color:#fff;font-weight:800;font-size:17px;letter-spacing:.02em">Edusphere <span style="color:#5cc0cf">Overseas</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:#0d2236">${esc(heading)}</h1>
${lines.map((l) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#333">${esc(l)}</p>`).join("")}
${button ? `<p style="margin:22px 0 6px"><a href="${esc(url)}" style="display:inline-block;background:#449aa8;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">${esc(button.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:16px 28px 24px;font-size:12px;line-height:1.5;color:#777;border-top:1px solid #eef1f4">You're receiving this because you have an account on the Edusphere Overseas student and parent portal.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [heading, "", ...lines, ...(button ? ["", `${button.label}: ${url}`] : [])].join("\n");
  return { html, text };
}

export async function sendEmail(email: Email) {
  const to = (Array.isArray(email.to) ? email.to : [email.to]).filter(Boolean);
  if (!to.length) return;
  const { html, text } = renderEmail(email);
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!key || !from) {
    console.info(`[email] (not sent: no RESEND_API_KEY/EMAIL_FROM) to=${to.join(",")} subject="${email.subject}"`);
    if (process.env.EMAIL_OUTBOX) {
      await appendFile(process.env.EMAIL_OUTBOX, JSON.stringify({ to, subject: email.subject, text }) + "\n").catch(() => {});
    }
    return;
  }
  try {
    const { error } = await new Resend(key).emails.send({ from, to, subject: email.subject, html, text, replyTo: email.replyTo });
    if (error) console.error("[email] failed:", error.message);
  } catch (error) {
    console.error("[email] failed:", error instanceof Error ? error.message : error);
  }
}

/** Where staff notifications go until the admin dashboard assigns owners. */
export const staffInbox = () => process.env.STAFF_EMAIL ?? "";

// ---------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------

export const emails = {
  linkRequest: (to: string, parentName: string) =>
    sendEmail({
      to,
      subject: `${parentName} asked to follow your application`,
      heading: `${parentName} would like to follow your application`,
      lines: [
        `${parentName} has asked to link to your Edusphere portal account as your parent or guardian.`,
        "If you approve, they can see your documents, application stages and service requests, upload documents and message your counsellor. You can remove them at any time.",
        "If you don't know this person, decline the request.",
      ],
      button: { label: "Review the request", path: "/portal/family" },
    }),

  linkApproved: (to: string, studentName: string) =>
    sendEmail({
      to,
      subject: `${studentName} approved your request`,
      heading: "You're now linked",
      lines: [`${studentName} approved your request. You can now follow their documents, applications and services in the portal.`],
      button: { label: "Open the portal", path: "/portal" },
    }),

  serviceRequested: (to: string[], serviceTitle: string, studentName: string) =>
    sendEmail({
      to,
      subject: `We've received your request: ${serviceTitle}`,
      heading: "Request received",
      lines: [
        `Thank you. We've received the ${serviceTitle.toLowerCase()} request for ${studentName}.`,
        "Our team will confirm the next steps. You'll get an email each time the status changes, and you can message us from the request page.",
      ],
      button: { label: "View the request", path: "/portal/services" },
    }),

  staffServiceRequested: (to: string, serviceTitle: string, studentName: string, summary: string) =>
    sendEmail({
      to,
      subject: `New request: ${serviceTitle} for ${studentName}`,
      heading: `New ${serviceTitle.toLowerCase()} request`,
      lines: [`${studentName} requested ${serviceTitle.toLowerCase()}.`, summary].filter(Boolean),
      button: { label: "Open the admin portal", path: "/admin" },
    }),

  newMessageForStaff: (to: string, studentName: string, preview: string) =>
    sendEmail({
      to,
      subject: `New portal message about ${studentName}`,
      heading: `New message about ${studentName}`,
      lines: [preview.length > 280 ? preview.slice(0, 277) + "…" : preview],
      button: { label: "Open the admin portal", path: "/admin" },
    }),

  // Sent from the admin dashboard (Step 5)
  documentDecision: (to: string[], documentName: string, approved: boolean, reason?: string | null) =>
    sendEmail({
      to,
      subject: approved ? `Approved: ${documentName}` : `Please upload ${documentName} again`,
      heading: approved ? `${documentName} is approved` : `${documentName} needs a new upload`,
      lines: approved
        ? ["Your counsellor has checked and approved this document."]
        : ["Your counsellor has asked for a new upload of this document.", reason ? `Reason: ${reason}` : ""].filter(Boolean),
      button: { label: "Open your documents", path: "/portal/documents" },
    }),

  stageChanged: (to: string[], university: string, stage: string) =>
    sendEmail({
      to,
      subject: `${university}: ${stage}`,
      heading: `Your application moved to "${stage}"`,
      lines: [`Your application to ${university} is now at the "${stage}" stage.`],
      button: { label: "Open your tracker", path: "/portal/applications" },
    }),

  serviceStatus: (to: string[], serviceTitle: string, status: string) =>
    sendEmail({
      to,
      subject: `${serviceTitle}: ${status}`,
      heading: `${serviceTitle}: ${status}`,
      lines: [`Your ${serviceTitle.toLowerCase()} request is now "${status}".`],
      button: { label: "View the request", path: "/portal/services" },
    }),
};
