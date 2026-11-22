import Link from "next/link";
import { AuthCard } from "./AuthForms";
import { btnPrimary } from "./ui";

/** Shown until the portal's database is connected (Supabase keys in Netlify). */
export function PortalUnavailable() {
  return (
    <AuthCard title="The portal opens soon" intro="Student and parent accounts are being set up. Until then, our team is a message away.">
      <Link href="/contact" className={`${btnPrimary} w-full`}>
        Contact us
      </Link>
    </AuthCard>
  );
}
