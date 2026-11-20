/**
 * Content area of the admin portal: Sanity Studio embedded in the site.
 * Team members sign in with the Sanity account they were invited to.
 */
import { NextStudio } from "next-sanity/studio";
import config from "../../../../../sanity.config";

export { metadata, viewport } from "next-sanity/studio";

export default function ContentStudioPage() {
  return <NextStudio config={config} />;
}
