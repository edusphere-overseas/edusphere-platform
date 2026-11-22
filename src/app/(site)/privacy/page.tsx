import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/pages/PageHero";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Edusphere Overseas collects, uses, shares and protects your information on our website and in the student and parent portal, and the choices you have.",
};

/** Change this date whenever the wording below changes. */
const LAST_UPDATED = "22 November 2026";

const h2 = "scroll-mt-28 text-2xl font-extrabold tracking-[-0.02em] text-white sm:text-[1.7rem]";
const h3 = "mt-6 text-base font-bold text-white";
const p = "mt-4 leading-relaxed text-white/75";
const ul = "mt-4 grid list-disc gap-2 pl-5 leading-relaxed text-white/75 marker:text-teal-light";
const a = "font-semibold text-teal-light underline-offset-4 hover:underline";

export default async function PrivacyPage() {
  const c = await getSiteContent();
  const legal = c.legalName.replace(/\.$/, "");
  const email =
    c.contacts.find((x) => x.kind === "email" && x.primary)?.value ??
    c.contacts.find((x) => x.kind === "email")?.value ??
    "edusphereoverseas@gmail.com";
  const office = c.offices[0];
  const address = office ? office.addressLines.join(", ") : "Mangaluru, Karnataka, India";

  const toc = [
    ["who", "Who we are"],
    ["collect", "What we collect"],
    ["use", "How we use it"],
    ["share", "Who we share it with"],
    ["abroad", "Transfers outside your country"],
    ["children", "Students under 18"],
    ["keep", "How long we keep it"],
    ["security", "How we protect it"],
    ["rights", "Your rights"],
    ["cookies", "Cookies and similar technology"],
    ["changes", "Changes to this policy"],
    ["contact", "Contact and complaints"],
  ] as const;

  return (
    <>
      <PageHero
        eyebrow="Privacy"
        crumbs={[{ href: "/privacy", label: "Privacy policy" }]}
        title={
          <>
            Privacy <span className="text-teal-light">policy</span>
          </>
        }
        intro={`How ${c.companyName} collects, uses, shares and protects your information when you visit our website, contact us, or use the student and parent portal.`}
      >
        <p className="text-sm text-white/50">Last updated {LAST_UPDATED}</p>
      </PageHero>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[16rem_1fr]">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">On this page</p>
              <ol className="mt-4 grid gap-2.5 text-sm">
                {toc.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="text-white/70 transition hover:text-white">
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="max-w-3xl">
            <p className="rounded-2xl border border-teal/30 bg-teal/10 px-5 py-4 leading-relaxed text-white/80">
              In short: we use your details to advise you and to manage your study abroad applications. We share them only with the
              people and organisations your applications need, such as universities and visa authorities, and with the companies that
              run our systems for us. We never sell your data, and you can ask us to see, correct or delete it at any time.
            </p>

            <h2 id="who" className={`${h2} mt-12`}>
              Who we are
            </h2>
            <p className={p}>
              {legal} (&quot;Edusphere&quot;, &quot;we&quot;, &quot;us&quot;) is a study abroad consultancy based at {address}. We decide how and why
              your personal data is used, so we are responsible for it: the &quot;data fiduciary&quot; under India&apos;s Digital Personal Data
              Protection Act 2023, and the &quot;controller&quot; under UK and EU data protection law where those apply to you.
            </p>
            <p className={p}>
              This policy covers this website, our enquiry and contact forms, the student and parent portal, and the messages, calls and
              WhatsApp chats you have with our team.
            </p>

            <h2 id="collect" className={`${h2} mt-14`}>
              What we collect
            </h2>
            <h3 className={h3}>When you send an enquiry</h3>
            <ul className={ul}>
              <li>Your name, phone number and, if you give it, your email address.</li>
              <li>What you&apos;re interested in (destination, study level, intake, preferred office) and any message you write.</li>
              <li>The page you sent it from, and the date and time.</li>
            </ul>
            <h3 className={h3}>When you create a portal account</h3>
            <ul className={ul}>
              <li>Your name, email address, optional mobile number, and whether you are a student or a parent.</li>
              <li>For students, your date of birth, so we know whether a parent or guardian needs to be involved.</li>
              <li>
                Your password, which our sign-in provider stores only in scrambled (hashed) form, or, if you use Google sign-in, the
                name and email address Google shares with us. We never see your Google password.
              </li>
              <li>A record of the consent you give, with its date and version, and any parent or guardian links you approve.</li>
            </ul>
            <h3 className={h3}>While we help you</h3>
            <ul className={ul}>
              <li>
                Your study plans and background: city, preferred countries, courses and intakes, academic history, test scores, work
                experience and how you plan to fund your studies.
              </li>
              <li>Your applications: universities, courses, deadlines, stages and notes from your counsellor.</li>
              <li>
                Documents you upload, such as your passport, academic certificates and transcripts, test reports, financial and
                sponsorship documents, and anything else an application or visa needs.
              </li>
              <li>Details for services you request, such as flight details for an airport pickup or your needs for accommodation.</li>
              <li>Messages between you, your parents and our team in the portal, and notes from calls and meetings.</li>
              <li>
                A log of who viewed, downloaded, approved or changed your records and documents, and when, so every access can be
                checked.
              </li>
            </ul>
            <h3 className={h3}>When you browse</h3>
            <ul className={ul}>
              <li>
                Technical details our hosting and security providers process to deliver the site and keep it safe, such as your IP
                address, browser type and the pages requested.
              </li>
              <li>A security check on the sign-in and sign-up pages, which tells bots and people apart (see Cookies below).</li>
            </ul>
            <p className={p}>
              Some documents, such as financial records, are sensitive. Please upload only what your counsellor asks for. We don&apos;t
              need information about your health, religion or political views, and we ask you not to send it unless an application
              specifically requires it.
            </p>

            <h2 id="use" className={`${h2} mt-14`}>
              How we use it
            </h2>
            <ul className={ul}>
              <li>To reply to your enquiry and to arrange counselling sessions.</li>
              <li>To advise you on courses, universities, scholarships and visas, and to prepare and track your applications.</li>
              <li>To provide the services you request, such as airport pickup, accommodation, scholarships or post-study work visas.</li>
              <li>To keep the parents or guardians you approve informed, and to let them help with documents and requests.</li>
              <li>To send you account emails (verifying your email, password resets, invitations) and updates about your requests.</li>
              <li>To keep the portal secure, prevent misuse, and keep records we are required to keep by law.</li>
            </ul>
            <p className={p}>
              We rely on your consent, which you give when you send an enquiry or create an account, and which you can withdraw at
              any time. Under UK and EU law we also rely on what&apos;s needed to provide the services you ask for, our legal
              obligations, and our legitimate interest in running a secure, well-organised service. Withdrawing consent doesn&apos;t
              affect what we did before, but we may not be able to continue your applications without the information they need.
            </p>
            <p className={p}>
              We don&apos;t sell your data, we don&apos;t use it for advertising, and we don&apos;t make decisions about you by automated means
              alone. Your counsellor makes every recommendation.
            </p>

            <h2 id="share" className={`${h2} mt-14`}>
              Who we share it with
            </h2>
            <h3 className={h3}>For your applications, when you ask us to</h3>
            <ul className={ul}>
              <li>Universities and colleges you apply to, and the admissions services they use.</li>
              <li>Visa and immigration authorities, and the visa application centres they appoint.</li>
              <li>
                Partners for services you request, such as airport pickup, accommodation, scholarship and education loan providers. We
                tell you who they are before we share anything.
              </li>
              <li>Parents or guardians you have linked and approved in the portal.</li>
            </ul>
            <h3 className={h3}>Companies that run our systems for us</h3>
            <p className={p}>
              These providers process data only on our instructions and under contracts that require them to protect it:
            </p>
            <ul className={ul}>
              <li>Supabase: portal database and sign-in, hosted in Mumbai, India.</li>
              <li>Cloudflare: private storage for uploaded documents (Asia-Pacific region) and the sign-in security check.</li>
              <li>Vercel: hosting for this website and portal, served from data centres around the world.</li>
              <li>
                Google: &quot;Continue with Google&quot; sign-in, the email account that sends portal emails, the map on our contact page,
                and the Google reviews shown on the site.
              </li>
              <li>Resend: delivery of notification emails to our team and to you.</li>
              <li>Sanity: the system we use to edit website pages. It holds website content, not your portal records.</li>
            </ul>
            <p className={p}>
              We may also share information when the law requires it, to protect someone&apos;s safety, or with professional advisers
              such as lawyers and auditors who are bound to keep it confidential.
            </p>

            <h2 id="abroad" className={`${h2} mt-14`}>
              Transfers outside your country
            </h2>
            <p className={p}>
              Studying abroad means your information goes abroad: to universities and authorities in the countries you apply to. Some
              of our providers also process data outside India, the UK or the EU, for example in the United States. Where the law
              requires it, we use contracts with safeguards such as standard contractual clauses, and we only transfer what the
              purpose needs.
            </p>

            <h2 id="children" className={`${h2} mt-14`}>
              Students under 18
            </h2>
            <p className={p}>
              If a student is under 18, a parent or legal guardian must link to the student&apos;s account and be approved before any
              documents can be uploaded, and the parent confirms that they are the student&apos;s parent or guardian. We do not use
              children&apos;s data for tracking, behavioural monitoring or advertising.
            </p>

            <h2 id="keep" className={`${h2} mt-14`}>
              How long we keep it
            </h2>
            <p className={p}>
              We keep your information only for as long as we need it for the purposes above. Enquiries that don&apos;t lead to an
              application are deleted when we no longer need them to help you. Portal accounts, applications and documents are kept
              while your account is open and for a limited period afterwards, to answer questions about your applications and to meet
              legal, visa and accounting obligations. After that we delete them or make them anonymous. You can ask us to delete your
              data sooner (see Your rights).
            </p>

            <h2 id="security" className={`${h2} mt-14`}>
              How we protect it
            </h2>
            <ul className={ul}>
              <li>Data is encrypted in transit and at rest by our providers.</li>
              <li>
                Access rules in the database mean students and parents see only their own records, and only authorised Edusphere
                staff can see them.
              </li>
              <li>Documents are stored privately. Each download uses a link that expires after five minutes, and every view is logged.</li>
              <li>Sign-up and sign-in are protected by email verification and a bot check, and passwords are never stored in readable form.</li>
            </ul>
            <p className={p}>
              No system is perfectly secure. If a breach affects your data, we will tell you and the relevant authorities as the law
              requires.
            </p>

            <h2 id="rights" className={`${h2} mt-14`}>
              Your rights
            </h2>
            <p className={p}>Depending on where you live, you can ask us to:</p>
            <ul className={ul}>
              <li>Tell you what data we hold about you and how we use it, and give you a copy.</li>
              <li>Correct, complete or update it.</li>
              <li>Delete it, unless we must keep it by law.</li>
              <li>Withdraw your consent at any time, as easily as you gave it.</li>
              <li>Restrict or object to how we use it, or move it to another provider (UK and EU).</li>
              <li>Nominate someone to exercise your rights if you die or become unable to (India).</li>
            </ul>
            <p className={p}>
              You can update most of your details yourself in the portal. For anything else, email{" "}
              <a href={`mailto:${email}`} className={a}>
                {email}
              </a>
              . We reply within 30 days and may ask you to confirm your identity first.
            </p>

            <h2 id="cookies" className={`${h2} mt-14`}>
              Cookies and similar technology
            </h2>
            <ul className={ul}>
              <li>
                Sign-in cookies: when you use the portal, small cookies keep you signed in. The portal can&apos;t work without them.
              </li>
              <li>
                Security check: Cloudflare Turnstile runs on the sign-in and sign-up pages to block bots. It looks at technical signals
                from your browser, not your identity.
              </li>
              <li>
                Intro animation: your browser remembers when you last saw our logo animation, so it doesn&apos;t replay every visit. This
                stays on your device.
              </li>
              <li>The map on our contact page is provided by Google, which may set its own cookies when the map loads.</li>
            </ul>
            <p className={p}>We don&apos;t use advertising cookies or tracking pixels.</p>

            <h2 id="changes" className={`${h2} mt-14`}>
              Changes to this policy
            </h2>
            <p className={p}>
              We&apos;ll update this page when our services or the law change, and show the date of the latest version at the top. If a
              change affects how we use data you have already given us, we&apos;ll tell you in the portal or by email first.
            </p>

            <h2 id="contact" className={`${h2} mt-14`}>
              Contact and complaints
            </h2>
            <p className={p}>
              For any question or request about your data, contact us at{" "}
              <a href={`mailto:${email}`} className={a}>
                {email}
              </a>{" "}
              or write to {legal}, {address}. You can also reach us through the{" "}
              <Link href="/contact" className={a}>
                contact page
              </Link>
              .
            </p>
            <p className={p}>
              If you&apos;re not satisfied with our answer, you can complain to the Data Protection Board of India. If you live in the
              UK, you can complain to the Information Commissioner&apos;s Office (ico.org.uk), and in the EU, to your local data
              protection authority.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
