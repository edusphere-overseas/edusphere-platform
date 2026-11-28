-- Eligibility check (28 Nov 2026): the website's "Check eligibility" form saves an enquiry,
-- so a counsellor can follow up even before the student applies.

alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('portal_signup', 'website_enquiry', 'booking', 'programme', 'course_finder', 'eligibility_check'));
