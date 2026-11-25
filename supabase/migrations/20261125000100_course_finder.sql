-- Course finder and "Apply" (25 Nov 2026)
--  * Enquiries can come from the course finder's Apply form.
--  * Students and linked parents can add universities to the student's list themselves
--    (stage "shortlist"), and remove ones they added while still on the shortlist.
--    Everything after that (applied, offers, visas) stays with Edusphere staff.

alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('portal_signup', 'website_enquiry', 'booking', 'programme', 'course_finder'));

-- Optional link to the course finder catalogue entry, e.g. "uk-10007774"
alter table public.applications add column if not exists university_ref text
  check (university_ref is null or char_length(university_ref) <= 40);

create policy "family adds universities" on public.applications for insert to authenticated
  with check (
    private.can_act_for_student(student_id)
    and created_by = (select auth.uid())
    and stage = 'shortlist'
    and status = 'active'
    and deadline is null
    and note is null
  );

create policy "family removes own shortlist" on public.applications for delete to authenticated
  using (
    private.can_act_for_student(student_id)
    and created_by = (select auth.uid())
    and stage = 'shortlist'
  );
